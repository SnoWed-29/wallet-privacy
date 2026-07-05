use tauri::State;

use crate::domain::accounts::dto::{
    ArchiveAccountRequest, CreateAccountRequest, UpdateAccountRequest,
};
use crate::domain::accounts::model::Account;
use crate::domain::accounts::service::AccountService;
use crate::errors::app_error::AppError;
use crate::state::app_state::AppState;

#[tauri::command]
pub async fn create_account(
    state: State<'_, AppState>,
    request: CreateAccountRequest,
) -> Result<Account, AppError> {
    let db = state.db().await?;
    let account = AccountService::create(&db, request).await?;
    state.persist().await?;
    Ok(account)
}

#[tauri::command]
pub async fn list_accounts(state: State<'_, AppState>) -> Result<Vec<Account>, AppError> {
    let db = state.db().await?;
    AccountService::list(&db).await
}

#[tauri::command]
pub async fn update_account(
    state: State<'_, AppState>,
    request: UpdateAccountRequest,
) -> Result<Account, AppError> {
    let db = state.db().await?;
    let account = AccountService::update(&db, request).await?;
    state.persist().await?;
    Ok(account)
}

#[tauri::command]
pub async fn archive_account(
    state: State<'_, AppState>,
    request: ArchiveAccountRequest,
) -> Result<(), AppError> {
    let db = state.db().await?;
    AccountService::archive(&db, request).await?;
    state.persist().await?;
    Ok(())
}
