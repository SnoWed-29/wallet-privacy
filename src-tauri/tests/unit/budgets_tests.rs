use wallet_lib::domain::budgets::dto::CreateBudgetRequest;
use wallet_lib::domain::budgets::service::BudgetService;

use crate::common::fixtures;
use crate::common::test_db;

#[tokio::test]
async fn create_budget_requires_valid_month() {
    let db = test_db::create_test_db().await;
    let category = fixtures::create_expense_category(&db.pool).await.unwrap();

    let result =
        BudgetService::create(&db.pool, fixtures::budget_request(&category.id, 13, 2026)).await;

    assert_eq!(
        result.unwrap_err().to_string(),
        "Budget month must be between 1 and 12."
    );
    db.close().await;
}

#[tokio::test]
async fn create_budget_requires_valid_year() {
    let db = test_db::create_test_db().await;
    let category = fixtures::create_expense_category(&db.pool).await.unwrap();

    let result =
        BudgetService::create(&db.pool, fixtures::budget_request(&category.id, 6, 10_000)).await;

    assert_eq!(
        result.unwrap_err().to_string(),
        "Budget year must be valid."
    );
    db.close().await;
}

#[tokio::test]
async fn create_budget_requires_expense_category() {
    let db = test_db::create_test_db().await;
    let category = fixtures::create_income_category(&db.pool).await.unwrap();

    let result =
        BudgetService::create(&db.pool, fixtures::budget_request(&category.id, 6, 2026)).await;

    assert_eq!(
        result.unwrap_err().to_string(),
        "Budgets can only use expense categories."
    );
    db.close().await;
}

#[tokio::test]
async fn budget_spending_tracks_expenses_in_same_category_and_month() {
    let db = test_db::create_test_db().await;
    let account = fixtures::create_account(&db.pool).await.unwrap();
    let category = fixtures::create_expense_category(&db.pool).await.unwrap();

    BudgetService::create(
        &db.pool,
        CreateBudgetRequest {
            name: "Food".to_string(),
            category_id: category.id.clone(),
            amount_minor: 10_000,
            month: 6,
            year: 2026,
        },
    )
    .await
    .unwrap();
    fixtures::create_expense_transaction(&db.pool, &account.id, &category.id)
        .await
        .unwrap();

    let budget = BudgetService::list(&db.pool).await.unwrap().remove(0);

    assert_eq!(budget.spent_minor, 3_500);
    assert_eq!(budget.remaining_minor, 6_500);
    assert_eq!(budget.progress_percentage, 35.0);
    assert!(!budget.is_near_limit);
    assert!(!budget.is_exceeded);
    db.close().await;
}
