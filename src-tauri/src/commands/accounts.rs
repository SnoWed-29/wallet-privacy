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
    AccountService::create(&state.db, request).await
}

#[tauri::command]
pub async fn list_accounts(state: State<'_, AppState>) -> Result<Vec<Account>, AppError> {
    AccountService::list(&state.db).await
}

#[tauri::command]
pub async fn update_account(
    state: State<'_, AppState>,
    request: UpdateAccountRequest,
) -> Result<Account, AppError> {
    AccountService::update(&state.db, request).await
}

#[tauri::command]
pub async fn archive_account(
    state: State<'_, AppState>,
    request: ArchiveAccountRequest,
) -> Result<(), AppError> {
    AccountService::archive(&state.db, request).await
}
