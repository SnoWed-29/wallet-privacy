use tauri::State;

use crate::domain::recurring_bills::dto::{
    ArchiveRecurringBillRequest, CreateRecurringBillRequest, MarkRecurringBillPaidRequest,
    UpdateRecurringBillRequest,
};
use crate::domain::recurring_bills::model::RecurringBill;
use crate::domain::recurring_bills::service::RecurringBillService;
use crate::errors::app_error::AppError;
use crate::state::app_state::AppState;

#[tauri::command]
pub async fn create_recurring_bill(
    state: State<'_, AppState>,
    request: CreateRecurringBillRequest,
) -> Result<RecurringBill, AppError> {
    let db = state.db().await?;
    let bill = RecurringBillService::create(&db, request).await?;
    state.persist().await?;
    Ok(bill)
}

#[tauri::command]
pub async fn list_recurring_bills(
    state: State<'_, AppState>,
) -> Result<Vec<RecurringBill>, AppError> {
    let db = state.db().await?;
    RecurringBillService::list(&db).await
}

#[tauri::command]
pub async fn update_recurring_bill(
    state: State<'_, AppState>,
    request: UpdateRecurringBillRequest,
) -> Result<RecurringBill, AppError> {
    let db = state.db().await?;
    let bill = RecurringBillService::update(&db, request).await?;
    state.persist().await?;
    Ok(bill)
}

#[tauri::command]
pub async fn archive_recurring_bill(
    state: State<'_, AppState>,
    request: ArchiveRecurringBillRequest,
) -> Result<(), AppError> {
    let db = state.db().await?;
    RecurringBillService::archive(&db, request).await?;
    state.persist().await?;
    Ok(())
}

#[tauri::command]
pub async fn mark_recurring_bill_paid(
    state: State<'_, AppState>,
    request: MarkRecurringBillPaidRequest,
) -> Result<RecurringBill, AppError> {
    let db = state.db().await?;
    let bill = RecurringBillService::mark_paid(&db, request).await?;
    state.persist().await?;
    Ok(bill)
}
