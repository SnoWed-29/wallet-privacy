use tauri::State;

use crate::domain::dashboard::dto::DashboardSummary;
use crate::domain::dashboard::service::DashboardService;
use crate::errors::app_error::AppError;
use crate::state::app_state::AppState;

#[tauri::command]
pub async fn get_dashboard_summary(
    state: State<'_, AppState>,
) -> Result<DashboardSummary, AppError> {
    DashboardService::get_summary(&state.db).await
}
