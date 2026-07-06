use tauri::State;

use crate::errors::app_error::AppError;
use crate::services::backup::dto::{BackupPreview, RestoreResult};
use crate::state::app_state::AppState;

#[tauri::command]
pub async fn create_wallet_backup(state: State<'_, AppState>) -> Result<String, AppError> {
    state.storage.encrypted_backup_json().await
}

#[tauri::command]
pub async fn validate_backup_file(
    state: State<'_, AppState>,
    json: String,
) -> Result<BackupPreview, AppError> {
    state.storage.preview_encrypted_backup_json(&json).await
}

#[tauri::command]
pub async fn restore_wallet_backup(
    state: State<'_, AppState>,
    json: String,
) -> Result<RestoreResult, AppError> {
    state.storage.restore_encrypted_backup_json(&json).await
}
