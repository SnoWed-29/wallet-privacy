use tauri::State;

use crate::errors::app_error::AppError;
use crate::services::r#import::dto::{ImportResult, ImportSummary};
use crate::services::r#import::service::ImportService;
use crate::state::app_state::AppState;

#[tauri::command]
pub async fn validate_import_file(json: String) -> Result<ImportSummary, AppError> {
    ImportService::validate_summary(&json)
}

#[tauri::command]
pub async fn import_wallet_data(
    state: State<'_, AppState>,
    json: String,
) -> Result<ImportResult, AppError> {
    ImportService::import_json(&state.db, &json).await
}
