use wallet_lib::commands;
use wallet_lib::domain::accounts::dto::CreateAccountRequest;
use wallet_lib::domain::accounts::service::AccountService;
use wallet_lib::state::app_state::AppState;

use crate::common::fixtures;
use crate::common::test_db;

#[tokio::test]
async fn command_modules_are_public_and_services_handle_command_payloads() {
    let db = test_db::create_test_db().await;
    let _state = AppState::new(db.pool.clone());
    let _command = commands::accounts::create_account;

    let account = AccountService::create(
        &db.pool,
        CreateAccountRequest {
            name: "Command payload account".to_string(),
            account_type: Some("cash".to_string()),
            currency: Some("mad".to_string()),
            initial_balance_minor: Some(0),
        },
    )
    .await
    .unwrap();

    assert_eq!(account.name, "Command payload account");
    assert_eq!(account.currency, "MAD");
    db.close().await;
}

#[tokio::test]
async fn command_payload_validation_matches_domain_validation() {
    let db = test_db::create_test_db().await;
    let account = fixtures::create_account(&db.pool).await.unwrap();
    let category = fixtures::create_expense_category(&db.pool).await.unwrap();
    let request = fixtures::transaction_request(&account.id, &category.id, "expense", 3_500);

    let transaction =
        wallet_lib::domain::transactions::service::TransactionService::create(&db.pool, request)
            .await
            .unwrap();

    assert_eq!(transaction.transaction_type, "expense");
    assert_eq!(transaction.amount_minor, 3_500);
    db.close().await;
}
