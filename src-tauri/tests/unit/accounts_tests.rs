use wallet_lib::domain::accounts::dto::CreateAccountRequest;
use wallet_lib::domain::accounts::service::AccountService;
use wallet_lib::domain::transactions::service::TransactionService;

use crate::common::fixtures;
use crate::common::test_db;

#[tokio::test]
async fn create_account_requires_name() {
    let db = test_db::create_test_db().await;

    let result = AccountService::create(
        &db.pool,
        CreateAccountRequest {
            name: "   ".to_string(),
            account_type: None,
            currency: None,
            initial_balance_minor: None,
        },
    )
    .await;

    assert!(result.is_err());
    assert_eq!(result.unwrap_err().to_string(), "Account name is required.");
    db.close().await;
}

#[tokio::test]
async fn create_account_rejects_negative_initial_balance() {
    let db = test_db::create_test_db().await;

    let result = AccountService::create(
        &db.pool,
        CreateAccountRequest {
            name: "Checking".to_string(),
            account_type: None,
            currency: None,
            initial_balance_minor: Some(-1),
        },
    )
    .await;

    assert!(result.is_err());
    assert_eq!(
        result.unwrap_err().to_string(),
        "Initial balance cannot be negative."
    );
    db.close().await;
}

#[tokio::test]
async fn account_balance_includes_income_and_expenses() {
    let db = test_db::create_test_db().await;
    let account = fixtures::create_account(&db.pool).await.unwrap();
    let income_category = fixtures::create_income_category(&db.pool).await.unwrap();
    let expense_category = fixtures::create_expense_category(&db.pool).await.unwrap();

    fixtures::create_income_transaction(&db.pool, &account.id, &income_category.id)
        .await
        .unwrap();
    fixtures::create_expense_transaction(&db.pool, &account.id, &expense_category.id)
        .await
        .unwrap();

    let accounts = AccountService::list(&db.pool).await.unwrap();
    let account = accounts
        .into_iter()
        .find(|item| item.id == account.id)
        .unwrap();

    assert_eq!(account.balance_minor, 26_500);
    assert_eq!(TransactionService::list(&db.pool).await.unwrap().len(), 2);
    db.close().await;
}
