use tauri::State;

use crate::domain::transactions::dto::{
    CreateTransactionRequest, DeleteTransactionRequest, UpdateTransactionRequest,
};
use crate::domain::transactions::model::Transaction;
use crate::domain::transactions::service::TransactionService;
use crate::errors::app_error::AppError;
use crate::state::app_state::AppState;

#[tauri::command]
pub async fn create_transaction(
    state: State<'_, AppState>,
    request: CreateTransactionRequest,
) -> Result<Transaction, AppError> {
    TransactionService::create(&state.db, request).await
}

#[tauri::command]
pub async fn update_transaction(
    state: State<'_, AppState>,
    request: UpdateTransactionRequest,
) -> Result<Transaction, AppError> {
    TransactionService::update(&state.db, request).await
}

#[tauri::command]
pub async fn delete_transaction(
    state: State<'_, AppState>,
    request: DeleteTransactionRequest,
) -> Result<(), AppError> {
    TransactionService::delete(&state.db, request).await
}

#[tauri::command]
pub async fn list_transactions(state: State<'_, AppState>) -> Result<Vec<Transaction>, AppError> {
    TransactionService::list(&state.db).await
}
