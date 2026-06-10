use wallet_lib::domain::budgets::service::BudgetService;
use wallet_lib::domain::savings_goals::dto::ContributeToSavingsGoalRequest;
use wallet_lib::domain::savings_goals::service::SavingsGoalService;
use wallet_lib::domain::transactions::service::TransactionService;

use crate::common::fixtures;
use crate::common::test_db;

#[tokio::test]
async fn prevents_negative_amounts_where_not_allowed() {
    let db = test_db::create_test_db().await;
    let account = fixtures::create_account(&db.pool).await.unwrap();
    let category = fixtures::create_expense_category(&db.pool).await.unwrap();

    let result = TransactionService::create(
        &db.pool,
        fixtures::transaction_request(&account.id, &category.id, "expense", -100),
    )
    .await;

    assert_eq!(
        result.unwrap_err().to_string(),
        "Transaction amount must be greater than 0."
    );
    db.close().await;
}

#[tokio::test]
async fn prevents_invalid_month_and_year() {
    let db = test_db::create_test_db().await;
    let category = fixtures::create_expense_category(&db.pool).await.unwrap();

    let invalid_month =
        BudgetService::create(&db.pool, fixtures::budget_request(&category.id, 0, 2026)).await;
    let invalid_year =
        BudgetService::create(&db.pool, fixtures::budget_request(&category.id, 6, 0)).await;

    assert_eq!(
        invalid_month.unwrap_err().to_string(),
        "Budget month must be between 1 and 12."
    );
    assert_eq!(
        invalid_year.unwrap_err().to_string(),
        "Budget year must be valid."
    );
    db.close().await;
}

#[tokio::test]
async fn prevents_transaction_without_valid_account_or_category() {
    let db = test_db::create_test_db().await;
    let account = fixtures::create_account(&db.pool).await.unwrap();
    let category = fixtures::create_expense_category(&db.pool).await.unwrap();

    let missing_account = TransactionService::create(
        &db.pool,
        fixtures::transaction_request("missing-account", &category.id, "expense", 100),
    )
    .await;
    let missing_category = TransactionService::create(
        &db.pool,
        fixtures::transaction_request(&account.id, "missing-category", "expense", 100),
    )
    .await;

    assert_eq!(
        missing_account.unwrap_err().to_string(),
        "Account does not exist."
    );
    assert_eq!(
        missing_category.unwrap_err().to_string(),
        "Category does not exist."
    );
    db.close().await;
}

#[tokio::test]
async fn prevents_savings_contribution_greater_than_remaining_target() {
    let db = test_db::create_test_db().await;
    let account = fixtures::create_account(&db.pool).await.unwrap();
    let goal = fixtures::create_savings_goal(&db.pool).await.unwrap();

    let result = SavingsGoalService::contribute(
        &db.pool,
        ContributeToSavingsGoalRequest {
            savings_goal_id: goal.id,
            account_id: account.id,
            amount_minor: 90_001,
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
