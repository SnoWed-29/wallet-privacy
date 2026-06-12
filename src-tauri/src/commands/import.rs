use tauri::State;

use crate::errors::app_error::AppError;
use crate::services::r#import::dto::{ImportMode, ImportPreview, ImportResult};
use crate::services::r#import::service::ImportService;
use crate::state::app_state::AppState;

#[tauri::command]
pub async fn validate_import_file(
    state: State<'_, AppState>,
    json: String,
) -> Result<ImportPreview, AppError> {
    ImportService::preview(&state.db, &json).await
}

#[tauri::command]
pub async fn import_wallet_data(
    state: State<'_, AppState>,
    json: String,
    mode: ImportMode,
) -> Result<ImportResult, AppError> {
    ImportService::import_json(&state.db, &json, mode).await
}
