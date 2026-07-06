use std::path::{Path, PathBuf};

use argon2::{Algorithm, Argon2, Params, Version};
use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use chacha20poly1305::aead::rand_core::RngCore;
use chacha20poly1305::aead::{Aead, AeadCore, KeyInit, OsRng};
use chacha20poly1305::{ChaCha20Poly1305, Key, Nonce};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use tokio::sync::RwLock;
use zeroize::Zeroizing;

use crate::database::connection;
use crate::errors::app_error::AppError;
use crate::services::backup::dto::{
    BackupDataCounts, BackupPreview, RestoreResult, WalletBackupMetadata, BACKUP_VERSION,
};
use crate::services::export::service::ExportService;
use crate::services::r#import::dto::{ImportMode, ImportResult};
use crate::services::r#import::service::ImportService;

use super::dto::SecurityStatus;

const ENCRYPTED_STORAGE_FILE: &str = "wallet.encrypted.json";
const LEGACY_DATABASE_FILE: &str = "wallet.db";
const ENCRYPTED_STORAGE_VERSION: &str = "1.0";
const CIPHER_NAME: &str = "ChaCha20-Poly1305";
const KDF_NAME: &str = "Argon2id";
const PASSWORD_CHECK: &[u8] = b"wallet-password-check-v1";
const SALT_LEN: usize = 16;
const NONCE_LEN: usize = 12;
const MIN_PASSWORD_CHARS: usize = 8;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct EncryptedWalletFile {
    version: String,
    cipher: String,
    kdf: String,
    salt: String,
    verification_nonce: String,
    verification: String,
    payload_nonce: String,
    payload: String,
    created_at: String,
    updated_at: String,
}

struct UnlockedStorage {
    pool: SqlitePool,
    key: Zeroizing<[u8; 32]>,
    salt: Vec<u8>,
    created_at: String,
}

enum StorageState {
    Locked,
    Unlocked(UnlockedStorage),
}

pub struct StorageManager {
    encrypted_path: Option<PathBuf>,
    legacy_path: Option<PathBuf>,
    state: RwLock<StorageState>,
}

impl StorageManager {
    pub fn locked(app_data_dir: PathBuf) -> Self {
        Self {
            encrypted_path: Some(app_data_dir.join(ENCRYPTED_STORAGE_FILE)),
            legacy_path: Some(app_data_dir.join(LEGACY_DATABASE_FILE)),
            state: RwLock::new(StorageState::Locked),
        }
    }

    pub fn unlocked_for_tests(pool: SqlitePool) -> Self {
        Self {
            encrypted_path: None,
            legacy_path: None,
            state: RwLock::new(StorageState::Unlocked(UnlockedStorage {
                pool,
                key: Zeroizing::new([0; 32]),
                salt: Vec::new(),
                created_at: Utc::now().to_rfc3339(),
            })),
        }
    }

    pub async fn status(&self) -> SecurityStatus {
        let has_encrypted_storage = self.encrypted_path.as_deref().is_some_and(Path::exists);
        let has_legacy_database = self.legacy_path.as_deref().is_some_and(Path::exists);
        let is_unlocked = matches!(*self.state.read().await, StorageState::Unlocked(_));

        SecurityStatus {
            has_encrypted_storage,
            has_legacy_database,
            is_unlocked,
            password_configured: has_encrypted_storage || is_unlocked,
            legacy_migration_required: has_legacy_database && !has_encrypted_storage,
        }
    }

    pub async fn pool(&self) -> Result<SqlitePool, AppError> {
        let guard = self.state.read().await;
        match &*guard {
            StorageState::Unlocked(storage) => Ok(storage.pool.clone()),
            StorageState::Locked => Err(AppError::Validation(
                "Unlock Wallet before opening local wallet data.".to_string(),
            )),
        }
    }

    pub async fn setup_password(&self, password: String) -> Result<SecurityStatus, AppError> {
        validate_password(&password)?;

        let encrypted_path = self.encrypted_path()?;
        if encrypted_path.exists() {
            return Err(AppError::Validation(
                "This wallet already has a local password.".to_string(),
            ));
        }

        if let Some(parent) = encrypted_path.parent() {
            tokio::fs::create_dir_all(parent).await?;
        }

        let created_at = Utc::now().to_rfc3339();
        let (key, salt) = derive_new_key(&password)?;
        let pool = connection::initialize_runtime_database().await?;

        if let Some(legacy_path) = self.legacy_path.as_deref().filter(|path| path.exists()) {
            let legacy_pool = connection::initialize_database_at_path(legacy_path).await?;
            let export_json = ExportService::export_json(&legacy_pool).await?;
            legacy_pool.close().await;
            ImportService::import_json(&pool, &export_json, ImportMode::Replace).await?;
        }

        self.write_encrypted_snapshot(&pool, &key, &salt, &created_at)
            .await?;
        let encrypted_json = tokio::fs::read_to_string(encrypted_path).await?;
        let verified_json = decrypt_wallet_json_with_key(&encrypted_json, &key)?;
        ImportService::validate_json(&verified_json)?;

        if let Some(legacy_path) = self.legacy_path.as_deref().filter(|path| path.exists()) {
            archive_legacy_database(legacy_path).await?;
        }

        let mut guard = self.state.write().await;
        *guard = StorageState::Unlocked(UnlockedStorage {
            pool,
            key,
            salt,
            created_at,
        });
        drop(guard);

        Ok(self.status().await)
    }

    pub async fn unlock(&self, password: String) -> Result<SecurityStatus, AppError> {
        if matches!(*self.state.read().await, StorageState::Unlocked(_)) {
            return Ok(self.status().await);
        }

        let encrypted_path = self.encrypted_path()?;
        if !encrypted_path.exists() {
            return Err(AppError::Validation(
                "Create a local wallet password first.".to_string(),
            ));
        }

        let encrypted_json = tokio::fs::read_to_string(encrypted_path).await?;
        let (key, salt, created_at, export_json) =
            decrypt_wallet_json_with_password(&encrypted_json, &password)?;
        let pool = connection::initialize_runtime_database().await?;
        ImportService::import_json(&pool, &export_json, ImportMode::Replace).await?;

        let mut guard = self.state.write().await;
        *guard = StorageState::Unlocked(UnlockedStorage {
            pool,
            key,
            salt,
            created_at,
        });
        drop(guard);

        Ok(self.status().await)
    }

    pub async fn lock(&self) -> Result<SecurityStatus, AppError> {
        self.persist().await?;

        let mut guard = self.state.write().await;
        let previous = std::mem::replace(&mut *guard, StorageState::Locked);
        drop(guard);

        if let StorageState::Unlocked(storage) = previous {
            storage.pool.close().await;
        }

        Ok(self.status().await)
    }

    pub async fn persist(&self) -> Result<(), AppError> {
        if self.encrypted_path.is_none() {
            return Ok(());
        }

        let guard = self.state.read().await;
        let StorageState::Unlocked(storage) = &*guard else {
            return Err(AppError::Validation(
                "Unlock Wallet before saving local wallet data.".to_string(),
            ));
        };

        self.write_encrypted_snapshot(
            &storage.pool,
            &storage.key,
            &storage.salt,
            &storage.created_at,
        )
        .await
    }

    pub async fn encrypted_backup_json(&self) -> Result<String, AppError> {
        self.persist().await?;
        let encrypted_path = self.encrypted_path()?;
        tokio::fs::read_to_string(encrypted_path)
            .await
            .map_err(AppError::from)
    }

    pub async fn preview_encrypted_backup_json(
        &self,
        json: &str,
    ) -> Result<BackupPreview, AppError> {
        let guard = self.state.read().await;
        let StorageState::Unlocked(storage) = &*guard else {
            return Err(AppError::Validation(
                "Unlock Wallet before validating a backup.".to_string(),
            ));
        };

        let export_json = decrypt_wallet_json_with_key(json, &storage.key)?;
        let preview = ImportService::preview(&storage.pool, &export_json).await?;
        let envelope = parse_envelope(json)?;

        Ok(BackupPreview {
            metadata: WalletBackupMetadata {
                backup_version: BACKUP_VERSION.to_string(),
                created_at: envelope.updated_at,
                app_version: Some(env!("CARGO_PKG_VERSION").to_string()),
                data_counts: BackupDataCounts {
                    accounts: preview.summary.accounts,
                    categories: preview.summary.categories,
                    transactions: preview.summary.transactions,
                    budgets: preview.summary.budgets,
                    recurring_bills: preview.summary.recurring_bills,
                    savings_goals: preview.summary.savings_goals,
                },
            },
            summary: preview.summary,
            duplicates: preview.duplicates,
            conflicts: preview.conflicts,
            warnings: preview.warnings,
        })
    }

    pub async fn restore_encrypted_backup_json(
        &self,
        json: &str,
    ) -> Result<RestoreResult, AppError> {
        let guard = self.state.read().await;
        let StorageState::Unlocked(storage) = &*guard else {
            return Err(AppError::Validation(
                "Unlock Wallet before restoring a backup.".to_string(),
            ));
        };

        let export_json = decrypt_wallet_json_with_key(json, &storage.key)?;
        let safety_backup_json = self
            .build_encrypted_snapshot(
                &storage.pool,
                &storage.key,
                &storage.salt,
                &storage.created_at,
            )
            .await?;
        let safety_backup_created_at = parse_envelope(&safety_backup_json)?.updated_at;
        let restored: ImportResult =
            ImportService::import_json(&storage.pool, &export_json, ImportMode::Replace).await?;
        self.write_encrypted_snapshot(
            &storage.pool,
            &storage.key,
            &storage.salt,
            &storage.created_at,
        )
        .await?;

        Ok(RestoreResult {
            restored,
            safety_backup_json,
            safety_backup_created_at,
        })
    }

    async fn write_encrypted_snapshot(
        &self,
        pool: &SqlitePool,
        key: &[u8; 32],
        salt: &[u8],
        created_at: &str,
    ) -> Result<(), AppError> {
        let encrypted_path = self.encrypted_path()?;
        let encrypted_json = self
            .build_encrypted_snapshot(pool, key, salt, created_at)
            .await?;
        write_file_atomically(encrypted_path, encrypted_json.as_bytes()).await
    }

    async fn build_encrypted_snapshot(
        &self,
        pool: &SqlitePool,
        key: &[u8; 32],
        salt: &[u8],
        created_at: &str,
    ) -> Result<String, AppError> {
        let export_json = ExportService::export_json(pool).await?;
        encrypt_wallet_json(key, salt, export_json.as_bytes(), created_at)
    }

    fn encrypted_path(&self) -> Result<&Path, AppError> {
        self.encrypted_path.as_deref().ok_or_else(|| {
            AppError::Validation(
                "Encrypted storage is not configured for this runtime.".to_string(),
            )
        })
    }
}

fn validate_password(password: &str) -> Result<(), AppError> {
    if password.is_empty() {
        return Err(AppError::Validation("Password is required.".to_string()));
    }

    if password.chars().count() < MIN_PASSWORD_CHARS {
        return Err(AppError::Validation(format!(
            "Password must be at least {MIN_PASSWORD_CHARS} characters."
        )));
    }

    Ok(())
}

fn derive_new_key(password: &str) -> Result<(Zeroizing<[u8; 32]>, Vec<u8>), AppError> {
    let mut salt = vec![0u8; SALT_LEN];
    OsRng.fill_bytes(&mut salt);
    let key = derive_key(password, &salt)?;
    Ok((key, salt))
}

fn derive_key(password: &str, salt: &[u8]) -> Result<Zeroizing<[u8; 32]>, AppError> {
    let params = Params::new(64 * 1024, 3, 1, Some(32)).map_err(|_| {
        AppError::Validation("Could not prepare local encryption settings.".to_string())
    })?;
    let argon2 = Argon2::new(Algorithm::Argon2id, Version::V0x13, params);
    let mut key = Zeroizing::new([0u8; 32]);

    // Argon2id is used to turn the user's local password into the file encryption key.
    argon2
        .hash_password_into(password.as_bytes(), salt, key.as_mut())
        .map_err(|_| AppError::Validation("Could not unlock this wallet.".to_string()))?;

    Ok(key)
}

fn encrypt_wallet_json(
    key: &[u8; 32],
    salt: &[u8],
    plaintext: &[u8],
    created_at: &str,
) -> Result<String, AppError> {
    let verification_nonce = ChaCha20Poly1305::generate_nonce(&mut OsRng);
    let payload_nonce = ChaCha20Poly1305::generate_nonce(&mut OsRng);
    let cipher = ChaCha20Poly1305::new(Key::from_slice(key));

    let verification = cipher
        .encrypt(&verification_nonce, PASSWORD_CHECK)
        .map_err(|_| AppError::Validation("Could not encrypt wallet data.".to_string()))?;
    let payload = cipher
        .encrypt(&payload_nonce, plaintext)
        .map_err(|_| AppError::Validation("Could not encrypt wallet data.".to_string()))?;

    let envelope = EncryptedWalletFile {
        version: ENCRYPTED_STORAGE_VERSION.to_string(),
        cipher: CIPHER_NAME.to_string(),
        kdf: KDF_NAME.to_string(),
        salt: BASE64.encode(salt),
        verification_nonce: BASE64.encode(verification_nonce.as_slice()),
        verification: BASE64.encode(verification),
        payload_nonce: BASE64.encode(payload_nonce.as_slice()),
        payload: BASE64.encode(payload),
        created_at: created_at.to_string(),
        updated_at: Utc::now().to_rfc3339(),
    };

    serde_json::to_string_pretty(&envelope).map_err(AppError::from)
}

fn decrypt_wallet_json_with_password(
    json: &str,
    password: &str,
) -> Result<(Zeroizing<[u8; 32]>, Vec<u8>, String, String), AppError> {
    let envelope = parse_envelope(json)?;
    let salt = decode_field("salt", &envelope.salt)?;
    let key = derive_key(password, &salt)?;
    let plaintext = decrypt_wallet_json_payload(&envelope, &key)?;
    Ok((key, salt, envelope.created_at, plaintext))
}

fn decrypt_wallet_json_with_key(json: &str, key: &[u8; 32]) -> Result<String, AppError> {
    let envelope = parse_envelope(json)?;
    decrypt_wallet_json_payload(&envelope, key)
}

fn decrypt_wallet_json_payload(
    envelope: &EncryptedWalletFile,
    key: &[u8; 32],
) -> Result<String, AppError> {
    if envelope.version != ENCRYPTED_STORAGE_VERSION
        || envelope.cipher != CIPHER_NAME
        || envelope.kdf != KDF_NAME
    {
        return Err(AppError::Validation(
            "This encrypted wallet file is not supported.".to_string(),
        ));
    }

    let verification_nonce = decode_nonce("verificationNonce", &envelope.verification_nonce)?;
    let verification = decode_field("verification", &envelope.verification)?;
    let payload_nonce = decode_nonce("payloadNonce", &envelope.payload_nonce)?;
    let payload = decode_field("payload", &envelope.payload)?;
    let cipher = ChaCha20Poly1305::new(Key::from_slice(key));

    let verified = cipher
        .decrypt(
            Nonce::from_slice(&verification_nonce),
            verification.as_ref(),
        )
        .map_err(|_| wrong_password_error())?;
    if verified != PASSWORD_CHECK {
        return Err(wrong_password_error());
    }

    let plaintext = cipher
        .decrypt(Nonce::from_slice(&payload_nonce), payload.as_ref())
        .map_err(|_| wrong_password_error())?;

    String::from_utf8(plaintext)
        .map_err(|_| AppError::Validation("Encrypted wallet data could not be read.".to_string()))
}

fn parse_envelope(json: &str) -> Result<EncryptedWalletFile, AppError> {
    serde_json::from_str(json)
        .map_err(|_| AppError::Validation("Encrypted wallet file is not valid.".to_string()))
}

fn decode_field(label: &str, value: &str) -> Result<Vec<u8>, AppError> {
    BASE64.decode(value).map_err(|_| {
        AppError::Validation(format!("Encrypted wallet field '{label}' is not valid."))
    })
}

fn decode_nonce(label: &str, value: &str) -> Result<[u8; NONCE_LEN], AppError> {
    let bytes = decode_field(label, value)?;
    if bytes.len() != NONCE_LEN {
        return Err(AppError::Validation(format!(
            "Encrypted wallet field '{label}' is not valid."
        )));
    }

    let mut nonce = [0u8; NONCE_LEN];
    nonce.copy_from_slice(&bytes);
    Ok(nonce)
}

fn wrong_password_error() -> AppError {
    AppError::Validation("That password did not unlock this wallet.".to_string())
}

async fn write_file_atomically(path: &Path, bytes: &[u8]) -> Result<(), AppError> {
    if let Some(parent) = path.parent() {
        tokio::fs::create_dir_all(parent).await?;
    }

    let temp_path = path.with_extension("tmp");
    tokio::fs::write(&temp_path, bytes).await?;
    if path.exists() {
        tokio::fs::remove_file(path).await?;
    }
    tokio::fs::rename(temp_path, path).await?;
    Ok(())
}

async fn archive_legacy_database(path: &Path) -> Result<(), AppError> {
    let timestamp = Utc::now().format("%Y%m%d%H%M%S");
    let archive_path = path.with_file_name(format!("wallet.unencrypted-migrated-{timestamp}.db"));
    tokio::fs::rename(path, archive_path).await?;
    Ok(())
}
