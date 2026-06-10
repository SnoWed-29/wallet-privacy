use wallet_lib::domain::transactions::dto::CreateTransactionRequest;
use wallet_lib::domain::transactions::service::TransactionService;

use crate::common::fixtures;
use crate::common::test_db;

#[tokio::test]
async fn create_transaction_requires_positive_amount() {
    let db = test_db::create_test_db().await;
    let account = fixtures::create_account(&db.pool).await.unwrap();
    let category = fixtures::create_expense_category(&db.pool).await.unwrap();

    let result = TransactionService::create(
        &db.pool,
        fixtures::transaction_request(&account.id, &category.id, "expense", 0),
    )
    .await;

    assert_eq!(
        result.unwrap_err().to_string(),
        "Transaction amount must be greater than 0."
    );
    db.close().await;
}

#[tokio::test]
async fn create_transaction_requires_valid_type() {
    let db = test_db::create_test_db().await;
    let account = fixtures::create_account(&db.pool).await.unwrap();
    let category = fixtures::create_expense_category(&db.pool).await.unwrap();

    let result = TransactionService::create(
        &db.pool,
        fixtures::transaction_request(&account.id, &category.id, "transfer", 10),
    )
    .await;

    assert_eq!(
        result.unwrap_err().to_string(),
        "Transaction type must be income or expense."
    );
    db.close().await;
}

#[tokio::test]
async fn create_transaction_requires_category_type_to_match_transaction_type() {
    let db = test_db::create_test_db().await;
    let account = fixtures::create_account(&db.pool).await.unwrap();
    let income_category = fixtures::create_income_category(&db.pool).await.unwrap();

    let result = TransactionService::create(
        &db.pool,
        fixtures::transaction_request(&account.id, &income_category.id, "expense", 10),
    )
    .await;

    assert_eq!(
        result.unwrap_err().to_string(),
        "Category type must match transaction type."
    );
    db.close().await;
}

#[tokio::test]
async fn create_income_transaction_persists_normalized_type_and_description() {
    let db = test_db::create_test_db().await;
    let account = fixtures::create_account(&db.pool).await.unwrap();
    let income_category = fixtures::create_income_category(&db.pool).await.unwrap();

    let transaction = TransactionService::create(
        &db.pool,
        CreateTransactionRequest {
            account_id: account.id,
            category_id: income_category.id,
            transaction_type: "INCOME".to_string(),
            amount_minor: 12_345,
            description: Some("  paycheck ".to_string()),
            transaction_date: "2026-06-10".to_string(),
        },
    )
    .await
    .unwrap();

    assert_eq!(transaction.transaction_type, "income");
    assert_eq!(transaction.amount_minor, 12_345);
    assert_eq!(transaction.description, Some("paycheck".to_string()));
    db.close().await;
}
