use tauri::State;

use crate::errors::app_error::AppError;
use crate::services::backup::dto::{BackupPreview, RestoreResult};
use crate::services::backup::service::BackupService;
use crate::state::app_state::AppState;

#[tauri::command]
pub async fn create_wallet_backup(state: State<'_, AppState>) -> Result<String, AppError> {
    BackupService::create_backup_json(&state.db).await
}

#[tauri::command]
pub async fn validate_backup_file(
    state: State<'_, AppState>,
    json: String,
) -> Result<BackupPreview, AppError> {
    BackupService::validate_backup_json(&state.db, &json).await
}

#[tauri::command]
pub async fn restore_wallet_backup(
    state: State<'_, AppState>,
    json: String,
) -> Result<RestoreResult, AppError> {
    BackupService::restore_backup_json(&state.db, &json).await
}
