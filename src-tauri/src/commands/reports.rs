use tauri::State;

use crate::domain::reports::dto::{ReportRequest, ReportsSummary};
use crate::domain::reports::service::ReportService;
use crate::errors::app_error::AppError;
use crate::state::app_state::AppState;

#[tauri::command]
pub async fn get_reports_summary(
    state: State<'_, AppState>,
    request: ReportRequest,
) -> Result<ReportsSummary, AppError> {
    ReportService::summary(&state.db, request).await
}
