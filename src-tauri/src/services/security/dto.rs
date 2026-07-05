use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SecurityStatus {
    pub has_encrypted_storage: bool,
    pub has_legacy_database: bool,
    pub is_unlocked: bool,
    pub password_configured: bool,
    pub legacy_migration_required: bool,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PasswordRequest {
    pub password: String,
}
