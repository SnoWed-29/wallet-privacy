use tauri::State;

use crate::domain::savings_goals::dto::{
    ArchiveSavingsGoalRequest, ContributeToSavingsGoalRequest, CreateSavingsGoalRequest,
    UpdateSavingsGoalRequest,
};
use crate::domain::savings_goals::model::SavingsGoal;
use crate::domain::savings_goals::service::SavingsGoalService;
use crate::errors::app_error::AppError;
use crate::state::app_state::AppState;

#[tauri::command]
pub async fn create_savings_goal(
    state: State<'_, AppState>,
    request: CreateSavingsGoalRequest,
) -> Result<SavingsGoal, AppError> {
    let db = state.db().await?;
    let goal = SavingsGoalService::create(&db, request).await?;
    state.persist().await?;
    Ok(goal)
}

#[tauri::command]
pub async fn list_savings_goals(state: State<'_, AppState>) -> Result<Vec<SavingsGoal>, AppError> {
    let db = state.db().await?;
    SavingsGoalService::list(&db).await
}

#[tauri::command]
pub async fn update_savings_goal(
    state: State<'_, AppState>,
    request: UpdateSavingsGoalRequest,
) -> Result<SavingsGoal, AppError> {
    let db = state.db().await?;
    let goal = SavingsGoalService::update(&db, request).await?;
    state.persist().await?;
    Ok(goal)
}

#[tauri::command]
pub async fn archive_savings_goal(
    state: State<'_, AppState>,
    request: ArchiveSavingsGoalRequest,
) -> Result<(), AppError> {
    let db = state.db().await?;
    SavingsGoalService::archive(&db, request).await?;
    state.persist().await?;
    Ok(())
}

#[tauri::command]
pub async fn contribute_to_savings_goal(
    state: State<'_, AppState>,
    request: ContributeToSavingsGoalRequest,
) -> Result<SavingsGoal, AppError> {
    let db = state.db().await?;
    let goal = SavingsGoalService::contribute(&db, request).await?;
    state.persist().await?;
    Ok(goal)
}
