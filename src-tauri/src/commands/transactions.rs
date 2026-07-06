use tauri::State;

use crate::domain::transactions::dto::{
    CreateTransactionRequest, DeleteTransactionRequest, TransactionFilterRequest,
    UpdateTransactionRequest,
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
    let db = state.db().await?;
    let transaction = TransactionService::create(&db, request).await?;
    state.persist().await?;
    Ok(transaction)
}

#[tauri::command]
pub async fn update_transaction(
    state: State<'_, AppState>,
    request: UpdateTransactionRequest,
) -> Result<Transaction, AppError> {
    let db = state.db().await?;
    let transaction = TransactionService::update(&db, request).await?;
    state.persist().await?;
    Ok(transaction)
}

#[tauri::command]
pub async fn delete_transaction(
    state: State<'_, AppState>,
    request: DeleteTransactionRequest,
) -> Result<(), AppError> {
    let db = state.db().await?;
    TransactionService::delete(&db, request).await?;
    state.persist().await?;
    Ok(())
}

#[tauri::command]
pub async fn list_transactions(state: State<'_, AppState>) -> Result<Vec<Transaction>, AppError> {
    let db = state.db().await?;
    TransactionService::list(&db).await
}

#[tauri::command]
pub async fn filter_transactions(
    state: State<'_, AppState>,
    request: TransactionFilterRequest,
) -> Result<Vec<Transaction>, AppError> {
    let db = state.db().await?;
    TransactionService::filter(&db, request).await
}
