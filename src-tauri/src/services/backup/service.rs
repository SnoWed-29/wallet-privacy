use chrono::Utc;
use serde_json::Value;
use sqlx::SqlitePool;

use crate::errors::app_error::AppError;
use crate::services::export::dto::WalletExport;
use crate::services::export::service::ExportService;
use crate::services::r#import::dto::ImportMode;
use crate::services::r#import::service::ImportService;

use super::dto::{
    BackupDataCounts, BackupPreview, RestoreResult, WalletBackup, WalletBackupMetadata,
    BACKUP_VERSION,
};

pub struct BackupService;

impl BackupService {
    pub fn backup_file_name_for_date(date: &str) -> String {
        format!("wallet-backup-{date}.json")
    }

    pub fn data_counts(export: &WalletExport) -> BackupDataCounts {
        BackupDataCounts {
            accounts: export.accounts.len(),
            categories: export.categories.len(),
            transactions: export.transactions.len(),
            budgets: export.budgets.len(),
            recurring_bills: export.recurring_bills.len(),
            savings_goals: export.savings_goals.len(),
        }
    }

    pub fn build_backup(
        created_at: String,
        app_version: Option<String>,
        data: WalletExport,
    ) -> WalletBackup<WalletExport> {
        WalletBackup {
            backup_version: BACKUP_VERSION.to_string(),
            created_at,
            app_version,
            data_counts: Self::data_counts(&data),
            data,
        }
    }

    pub async fn create_backup_json(pool: &SqlitePool) -> Result<String, AppError> {
        let export = ExportService::export(pool).await?;
        let backup = Self::build_backup(
            Utc::now().to_rfc3339(),
            Some(env!("CARGO_PKG_VERSION").to_string()),
            export,
        );
        Ok(serde_json::to_string_pretty(&backup)?)
    }

    pub async fn validate_backup_json(
        pool: &SqlitePool,
        json: &str,
    ) -> Result<BackupPreview, AppError> {
        let (metadata, data_json) = Self::extract_backup_data(json)?;
        let preview = ImportService::preview(pool, &data_json).await?;

        Ok(BackupPreview {
            metadata,
            summary: preview.summary,
            duplicates: preview.duplicates,
            conflicts: preview.conflicts,
            warnings: preview.warnings,
        })
    }

    pub async fn restore_backup_json(
        pool: &SqlitePool,
        json: &str,
    ) -> Result<RestoreResult, AppError> {
        let _preview = Self::validate_backup_json(pool, json).await?;
        let safety_backup_json = Self::create_backup_json(pool).await?;
        let safety_backup_created_at = Self::extract_backup_data(&safety_backup_json)?.0.created_at;
        let (_, data_json) = Self::extract_backup_data(json)?;
        let restored = ImportService::import_json(pool, &data_json, ImportMode::Replace).await?;

        Ok(RestoreResult {
            restored,
            safety_backup_json,
            safety_backup_created_at,
        })
    }

    fn extract_backup_data(json: &str) -> Result<(WalletBackupMetadata, String), AppError> {
        let value: Value = serde_json::from_str(json).map_err(|error| {
            AppError::Validation(format!("Backup file is not valid JSON: {error}"))
        })?;
        let object = value.as_object().ok_or_else(|| {
            AppError::Validation("Backup file must contain a JSON object.".to_string())
        })?;

        for field in ["backupVersion", "createdAt", "dataCounts", "data"] {
            if !object.contains_key(field) {
                return Err(AppError::Validation(format!(
                    "Backup file is missing required property '{field}'."
                )));
            }
        }

        let metadata = WalletBackupMetadata {
            backup_version: object
                .get("backupVersion")
                .and_then(Value::as_str)
                .unwrap_or_default()
                .to_string(),
            created_at: object
                .get("createdAt")
                .and_then(Value::as_str)
                .unwrap_or_default()
                .to_string(),
            app_version: object
                .get("appVersion")
                .and_then(Value::as_str)
                .map(ToString::to_string),
            data_counts: serde_json::from_value(
                object
                    .get("dataCounts")
                    .cloned()
                    .ok_or_else(|| AppError::Validation("dataCounts is required.".to_string()))?,
            )
            .map_err(|error| {
                AppError::Validation(format!("Backup dataCounts is invalid: {error}"))
            })?,
        };

        if metadata.backup_version != BACKUP_VERSION {
            return Err(AppError::Validation(format!(
                "Unsupported backup version '{}'. Expected '{}'.",
                metadata.backup_version, BACKUP_VERSION
            )));
        }
        if metadata.created_at.trim().is_empty() {
            return Err(AppError::Validation("createdAt is required.".to_string()));
        }

        let data = object
            .get("data")
            .ok_or_else(|| AppError::Validation("Backup data is required.".to_string()))?;
        Ok((metadata, serde_json::to_string(data)?))
    }
}
