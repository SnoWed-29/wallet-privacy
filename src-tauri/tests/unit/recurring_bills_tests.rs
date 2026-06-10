use wallet_lib::domain::recurring_bills::dto::{
    CreateRecurringBillRequest, MarkRecurringBillPaidRequest,
};
use wallet_lib::domain::recurring_bills::service::RecurringBillService;
use wallet_lib::domain::transactions::service::TransactionService;

use crate::common::fixtures;
use crate::common::test_db;

#[tokio::test]
async fn create_recurring_bill_requires_allowed_frequency() {
    let db = test_db::create_test_db().await;
    let account = fixtures::create_account(&db.pool).await.unwrap();
    let category = fixtures::create_expense_category(&db.pool).await.unwrap();

    let result = RecurringBillService::create(
        &db.pool,
        CreateRecurringBillRequest {
            frequency: "fortnightly".to_string(),
            ..fixtures::recurring_bill_request(&account.id, &category.id)
        },
    )
    .await;

    assert_eq!(
        result.unwrap_err().to_string(),
        "Recurring bill frequency must be daily, weekly, monthly, or yearly."
    );
    db.close().await;
}

#[tokio::test]
async fn create_recurring_bill_requires_valid_due_date() {
    let db = test_db::create_test_db().await;
    let account = fixtures::create_account(&db.pool).await.unwrap();
    let category = fixtures::create_expense_category(&db.pool).await.unwrap();

    let result = RecurringBillService::create(
        &db.pool,
        CreateRecurringBillRequest {
            next_due_date: "06/15/2026".to_string(),
            ..fixtures::recurring_bill_request(&account.id, &category.id)
        },
    )
    .await;

    assert_eq!(
        result.unwrap_err().to_string(),
        "Next due date must use YYYY-MM-DD format."
    );
    db.close().await;
}

#[tokio::test]
async fn marking_recurring_bill_paid_creates_transaction_and_advances_due_date() {
    let db = test_db::create_test_db().await;
    let account = fixtures::create_account(&db.pool).await.unwrap();
    let category = fixtures::create_expense_category(&db.pool).await.unwrap();
    let bill = fixtures::create_recurring_bill(&db.pool, &account.id, &category.id)
        .await
        .unwrap();

    let updated = RecurringBillService::mark_paid(
        &db.pool,
        MarkRecurringBillPaidRequest {
            id: bill.id,
            paid_date: Some("2026-06-20".to_string()),
        },
    )
    .await
    .unwrap();
    let transactions = TransactionService::list(&db.pool).await.unwrap();

    assert_eq!(updated.last_paid_date, Some("2026-06-20".to_string()));
    assert_eq!(updated.next_due_date, "2026-07-20");
    assert_eq!(transactions.len(), 1);
    assert_eq!(transactions[0].transaction_type, "expense");
    assert_eq!(transactions[0].amount_minor, 2_500);
    db.close().await;
}
