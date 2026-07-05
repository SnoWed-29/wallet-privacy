use serde_json::Value;
use wallet_lib::database::connection;
use wallet_lib::domain::accounts::dto::CreateAccountRequest;
use wallet_lib::domain::accounts::service::AccountService;
use wallet_lib::services::security::storage::StorageManager;

#[tokio::test]
async fn password_setup_encrypts_storage_and_unlocks_with_the_same_password() {
    let dir = tempfile::tempdir().expect("create temp app data dir");
    let storage = StorageManager::locked(dir.path().to_path_buf());

    let status = storage
        .setup_password("correct horse battery".to_string())
        .await
        .expect("setup encrypted storage");
    assert!(status.has_encrypted_storage);
    assert!(status.is_unlocked);
    assert!(status.password_configured);

    let pool = storage.pool().await.expect("wallet stays unlocked");
    AccountService::create(&pool, account_request("Checking"))
        .await
        .expect("create account in encrypted runtime database");
    storage.persist().await.expect("persist encrypted snapshot");

    let encrypted_path = dir.path().join("wallet.encrypted.json");
    let encrypted_json =
        std::fs::read_to_string(&encrypted_path).expect("read encrypted wallet file");
    let envelope: Value =
        serde_json::from_str(&encrypted_json).expect("encrypted wallet is JSON envelope");
    assert_eq!(envelope["cipher"], "ChaCha20-Poly1305");
    assert_eq!(envelope["kdf"], "Argon2id");
    assert!(envelope["salt"]
        .as_str()
        .is_some_and(|value| !value.is_empty()));
    assert!(!encrypted_json.contains("Checking"));
    assert!(!encrypted_json.contains("correct horse battery"));

    let locked_status = storage.lock().await.expect("lock wallet");
    assert!(!locked_status.is_unlocked);
    assert!(storage.pool().await.is_err());

    let wrong_password = storage.unlock("wrong password".to_string()).await;
    assert!(wrong_password.is_err());
    assert_eq!(
        wrong_password.unwrap_err().to_string(),
        "That password did not unlock this wallet."
    );

    let unlocked_status = storage
        .unlock("correct horse battery".to_string())
        .await
        .expect("unlock with original password");
    assert!(unlocked_status.is_unlocked);

    let pool = storage.pool().await.expect("pool after unlock");
    let accounts = AccountService::list(&pool)
        .await
        .expect("list accounts after unlock");
    assert_eq!(accounts.len(), 1);
    assert_eq!(accounts[0].name, "Checking");

    storage.lock().await.expect("close runtime pool");
}

#[tokio::test]
async fn setup_password_migrates_existing_unencrypted_wallet_db() {
    let dir = tempfile::tempdir().expect("create temp app data dir");
    let legacy_path = dir.path().join("wallet.db");
    let legacy_pool = connection::initialize_database_at_path(&legacy_path)
        .await
        .expect("create legacy database");
    AccountService::create(&legacy_pool, account_request("Legacy cash"))
        .await
        .expect("seed legacy account");
    legacy_pool.close().await;

    let storage = StorageManager::locked(dir.path().to_path_buf());
    let initial_status = storage.status().await;
    assert!(initial_status.has_legacy_database);
    assert!(initial_status.legacy_migration_required);

    let migrated_status = storage
        .setup_password("migrate password".to_string())
        .await
        .expect("migrate legacy database into encrypted storage");
    assert!(migrated_status.has_encrypted_storage);
    assert!(!migrated_status.has_legacy_database);
    assert!(!legacy_path.exists());

    let archive_exists = std::fs::read_dir(dir.path())
        .expect("read app data dir")
        .filter_map(Result::ok)
        .any(|entry| {
            entry
                .file_name()
                .to_string_lossy()
                .starts_with("wallet.unencrypted-migrated-")
        });
    assert!(archive_exists);

    let pool = storage.pool().await.expect("pool after migration");
    let accounts = AccountService::list(&pool)
        .await
        .expect("list migrated accounts");
    assert!(accounts.iter().any(|account| account.name == "Legacy cash"));

    storage.lock().await.expect("close runtime pool");
}

#[tokio::test]
async fn encrypted_backup_preview_and_restore_use_the_active_wallet_key() {
    let dir = tempfile::tempdir().expect("create temp app data dir");
    let storage = StorageManager::locked(dir.path().to_path_buf());
    storage
        .setup_password("backup password".to_string())
        .await
        .expect("setup encrypted storage");

    let pool = storage.pool().await.expect("pool after setup");
    let original = AccountService::create(&pool, account_request("Original account"))
        .await
        .expect("create original account");
    storage.persist().await.expect("persist original account");

    let backup_json = storage
        .encrypted_backup_json()
        .await
        .expect("create encrypted backup");
    assert!(!backup_json.contains("Original account"));

    let preview = storage
        .preview_encrypted_backup_json(&backup_json)
        .await
        .expect("preview encrypted backup");
    assert_eq!(preview.summary.accounts, 1);

    AccountService::create(&pool, account_request("Temporary account"))
        .await
        .expect("create temporary account");
    storage.persist().await.expect("persist temporary account");

    let restore = storage
        .restore_encrypted_backup_json(&backup_json)
        .await
        .expect("restore encrypted backup");
    assert_eq!(restore.restored.imported.accounts, 1);
    assert!(!restore.safety_backup_json.contains("Temporary account"));

    let accounts = AccountService::list(&pool)
        .await
        .expect("list restored accounts");
    assert_eq!(accounts.len(), 1);
    assert_eq!(accounts[0].id, original.id);
    assert_eq!(accounts[0].name, "Original account");

    storage.lock().await.expect("close runtime pool");
}

fn account_request(name: &str) -> CreateAccountRequest {
    CreateAccountRequest {
        name: name.to_string(),
        account_type: Some("cash".to_string()),
        currency: Some("MAD".to_string()),
        initial_balance_minor: Some(0),
    }
}
