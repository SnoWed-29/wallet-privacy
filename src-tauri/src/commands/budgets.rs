use tauri::State;

use crate::domain::budgets::dto::{ArchiveBudgetRequest, CreateBudgetRequest, UpdateBudgetRequest};
use crate::domain::budgets::model::Budget;
use crate::domain::budgets::service::BudgetService;
use crate::errors::app_error::AppError;
use crate::state::app_state::AppState;

#[tauri::command]
pub async fn create_budget(
    state: State<'_, AppState>,
    request: CreateBudgetRequest,
) -> Result<Budget, AppError> {
    let db = state.db().await?;
    let budget = BudgetService::create(&db, request).await?;
    state.persist().await?;
    Ok(budget)
}

#[tauri::command]
pub async fn list_budgets(state: State<'_, AppState>) -> Result<Vec<Budget>, AppError> {
    let db = state.db().await?;
    BudgetService::list(&db).await
}

#[tauri::command]
pub async fn update_budget(
    state: State<'_, AppState>,
    request: UpdateBudgetRequest,
) -> Result<Budget, AppError> {
    let db = state.db().await?;
    let budget = BudgetService::update(&db, request).await?;
    state.persist().await?;
    Ok(budget)
}

#[tauri::command]
pub async fn archive_budget(
    state: State<'_, AppState>,
    request: ArchiveBudgetRequest,
) -> Result<(), AppError> {
    let db = state.db().await?;
    BudgetService::archive(&db, request).await?;
    state.persist().await?;
    Ok(())
}
