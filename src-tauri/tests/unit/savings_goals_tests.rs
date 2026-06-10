use wallet_lib::domain::savings_goals::dto::{
    ContributeToSavingsGoalRequest, CreateSavingsGoalRequest,
};
use wallet_lib::domain::savings_goals::service::SavingsGoalService;
use wallet_lib::domain::transactions::service::TransactionService;

use crate::common::fixtures;
use crate::common::test_db;

#[tokio::test]
async fn create_savings_goal_requires_positive_target() {
    let db = test_db::create_test_db().await;

    let result = SavingsGoalService::create(
        &db.pool,
        CreateSavingsGoalRequest {
            target_amount_minor: 0,
            ..fixtures::savings_goal_request("Emergency fund")
        },
    )
    .await;

    assert_eq!(
        result.unwrap_err().to_string(),
        "Savings goal target amount must be greater than 0."
    );
    db.close().await;
}

#[tokio::test]
async fn create_savings_goal_rejects_current_amount_above_target() {
    let db = test_db::create_test_db().await;

    let result = SavingsGoalService::create(
        &db.pool,
        CreateSavingsGoalRequest {
            target_amount_minor: 1_000,
            current_amount_minor: Some(1_001),
            ..fixtures::savings_goal_request("Emergency fund")
        },
    )
    .await;

    assert_eq!(
        result.unwrap_err().to_string(),
        "Savings goal current amount cannot exceed target amount."
    );
    db.close().await;
}

#[tokio::test]
async fn contribute_to_savings_goal_updates_goal_and_creates_transaction() {
    let db = test_db::create_test_db().await;
    let account = fixtures::create_account(&db.pool).await.unwrap();
    let goal = fixtures::create_savings_goal(&db.pool).await.unwrap();

    let updated = SavingsGoalService::contribute(
        &db.pool,
        ContributeToSavingsGoalRequest {
            savings_goal_id: goal.id,
            account_id: account.id,
            amount_minor: 15_000,
            transaction_date: Some("2026-06-10".to_string()),
            description: Some("June contribution".to_string()),
        },
    )
    .await
    .unwrap();
    let transactions = TransactionService::list(&db.pool).await.unwrap();

    assert_eq!(updated.current_amount_minor, 25_000);
    assert_eq!(updated.remaining_amount_minor, 75_000);
    assert_eq!(transactions.len(), 1);
    assert_eq!(transactions[0].transaction_type, "expense");
    assert_eq!(transactions[0].amount_minor, 15_000);
    db.close().await;
}

#[tokio::test]
async fn contribute_to_savings_goal_cannot_exceed_target() {
    let db = test_db::create_test_db().await;
    let account = fixtures::create_account(&db.pool).await.unwrap();
    let goal = fixtures::create_savings_goal(&db.pool).await.unwrap();

    let result = SavingsGoalService::contribute(
        &db.pool,
        ContributeToSavingsGoalRequest {
            savings_goal_id: goal.id,
            account_id: account.id,
            amount_minor: 100_000,
            transaction_date: None,
            description: None,
        },
    )
    .await;

    assert_eq!(
        result.unwrap_err().to_string(),
        "Contribution cannot exceed the savings goal target."
    );
    db.close().await;
}
