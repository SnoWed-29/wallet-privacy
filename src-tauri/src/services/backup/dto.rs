use serde::{Deserialize, Serialize};

use crate::services::r#import::dto::{ImportEntityCounts, ImportResult, ImportSummary};

pub const BACKUP_VERSION: &str = "1.0";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupDataCounts {
    pub accounts: usize,
    pub categories: usize,
    pub transactions: usize,
    pub budgets: usize,
    pub recurring_bills: usize,
    pub savings_goals: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WalletBackupMetadata {
    pub backup_version: String,
    pub created_at: String,
    pub app_version: Option<String>,
    pub data_counts: BackupDataCounts,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WalletBackup<T: Serialize> {
    pub backup_version: String,
    pub created_at: String,
    pub app_version: Option<String>,
    pub data_counts: BackupDataCounts,
    pub data: T,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupPreview {
    pub metadata: WalletBackupMetadata,
    pub summary: ImportSummary,
    pub duplicates: ImportEntityCounts,
    pub conflicts: ImportEntityCounts,
    pub warnings: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RestoreResult {
    pub restored: ImportResult,
    pub safety_backup_json: String,
    pub safety_backup_created_at: String,
}
