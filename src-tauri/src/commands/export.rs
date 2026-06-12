use tauri::State;

use crate::errors::app_error::AppError;
use crate::services::export::service::ExportService;
use crate::state::app_state::AppState;

#[tauri::command]
pub async fn export_wallet_data(state: State<'_, AppState>) -> Result<String, AppError> {
    ExportService::export_json(&state.db).await
}
