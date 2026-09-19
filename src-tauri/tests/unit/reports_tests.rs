use wallet_lib::domain::accounts::dto::CreateAccountRequest;
use wallet_lib::domain::accounts::service::AccountService;
use wallet_lib::domain::categories::dto::CreateCategoryRequest;
use wallet_lib::domain::categories::service::CategoryService;
use wallet_lib::domain::recurring_bills::dto::CreateRecurringBillRequest;
use wallet_lib::domain::recurring_bills::service::RecurringBillService;
use wallet_lib::domain::reports::dto::ReportRequest;
use wallet_lib::domain::reports::service::ReportService;
use wallet_lib::domain::savings_goals::dto::{
    ContributeToSavingsGoalRequest, CreateSavingsGoalRequest,
};
use wallet_lib::domain::savings_goals::service::SavingsGoalService;
use wallet_lib::domain::transactions::dto::CreateTransactionRequest;
use wallet_lib::domain::transactions::service::TransactionService;

use crate::common::test_db;

#[tokio::test]
async fn reports_calculate_totals_savings_rate_and_zero_income_safely() {
    let db = test_db::create_test_db().await;
    let account = create_account(&db.pool, "Checking", "MAD").await;
    let income = create_category(&db.pool, "Salary", "income").await;
    let groceries = create_category(&db.pool, "Groceries", "expense").await;

    create_transaction(
        &db.pool,
        &account.id,
        &income.id,
        "income",
        100_000,
        "2026-06-02",
    )
    .await;
    create_transaction(
        &db.pool,
        &account.id,
        &groceries.id,
        "expense",
        25_000,
        "2026-06-03",
    )
    .await;

    let report = ReportService::summary(&db.pool, request("2026-06-01", "2026-06-30"))
        .await
        .unwrap();
    let summary = report
        .currency_summaries
        .iter()
        .find(|summary| summary.currency == "MAD")
        .unwrap();

    assert_eq!(summary.total_income_minor, 100_000);
    assert_eq!(summary.total_expense_minor, 25_000);
    assert_eq!(summary.net_cash_flow_minor, 75_000);
    assert_eq!(summary.savings_rate_percent, 75.0);
    assert_eq!(summary.transaction_count, 2);

    let expense_only = ReportService::summary(
        &db.pool,
        ReportRequest {
            transaction_type: Some("expense".to_string()),
            ..request("2026-06-01", "2026-06-30")
        },
    )
    .await
    .unwrap();
    let expense_summary = &expense_only.currency_summaries[0];

    assert_eq!(expense_summary.total_income_minor, 0);
    assert_eq!(expense_summary.savings_rate_percent, 0.0);
    assert!(expense_summary.savings_rate_percent.is_finite());

    db.close().await;
}

#[tokio::test]
async fn reports_apply_date_account_category_type_and_currency_filters() {
    let db = test_db::create_test_db().await;
    let mad_account = create_account(&db.pool, "Checking", "MAD").await;
    let usd_account = create_account(&db.pool, "Dollar wallet", "USD").await;
    let income = create_category(&db.pool, "Salary", "income").await;
    let food = create_category(&db.pool, "Food", "expense").await;
    let travel = create_category(&db.pool, "Travel", "expense").await;

    create_transaction(
        &db.pool,
        &mad_account.id,
        &income.id,
        "income",
        200_000,
        "2026-06-03",
    )
    .await;
    create_transaction(
        &db.pool,
        &mad_account.id,
        &food.id,
        "expense",
        20_000,
        "2026-06-04",
    )
    .await;
    create_transaction(
        &db.pool,
        &usd_account.id,
        &travel.id,
        "expense",
        10_000,
        "2026-06-05",
    )
    .await;
    create_transaction(
        &db.pool,
        &mad_account.id,
        &food.id,
        "expense",
        5_000,
        "2026-07-01",
    )
    .await;

    let report = ReportService::summary(
        &db.pool,
        ReportRequest {
            start_date: "2026-06-01".to_string(),
            end_date: "2026-06-30".to_string(),
            account_id: Some(mad_account.id.clone()),
            category_id: Some(food.id.clone()),
            transaction_type: Some("expense".to_string()),
            currency: Some("MAD".to_string()),
        },
    )
    .await
    .unwrap();

    assert_eq!(report.matching_transactions.len(), 1);
    assert_eq!(report.matching_transactions[0].amount_minor, 20_000);
    assert!(!report.has_mixed_currencies);

    let mixed = ReportService::summary(&db.pool, request("2026-06-01", "2026-06-30"))
        .await
        .unwrap();
    assert!(mixed.has_mixed_currencies);
    assert_eq!(mixed.currency_summaries.len(), 2);

    db.close().await;
}

#[tokio::test]
async fn reports_group_trends_and_compare_previous_periods() {
    let db = test_db::create_test_db().await;
    let account = create_account(&db.pool, "Checking", "MAD").await;
    let income = create_category(&db.pool, "Salary", "income").await;
    let expense = create_category(&db.pool, "Bills", "expense").await;

    create_transaction(
        &db.pool,
        &account.id,
        &income.id,
        "income",
        100_000,
        "2026-06-10",
    )
    .await;
    create_transaction(
        &db.pool,
        &account.id,
        &expense.id,
        "expense",
        40_000,
        "2026-06-11",
    )
    .await;
    create_transaction(
        &db.pool,
        &account.id,
        &income.id,
        "income",
        50_000,
        "2026-05-10",
    )
    .await;
    create_transaction(
        &db.pool,
        &account.id,
        &expense.id,
        "expense",
        20_000,
        "2026-05-11",
    )
    .await;

    let report = ReportService::summary(&db.pool, request("2026-06-01", "2026-06-30"))
        .await
        .unwrap();

    assert_eq!(report.filters.grouping, "daily");
    assert_eq!(report.trend.len(), 30);
    let comparison = &report.period_comparison[0];
    assert_eq!(comparison.income.current_minor, 100_000);
    assert_eq!(comparison.income.previous_minor, 50_000);
    assert_eq!(comparison.expenses.change_minor, 20_000);

    let long_report = ReportService::summary(&db.pool, request("2026-01-01", "2026-12-31"))
        .await
        .unwrap();
    assert_eq!(long_report.filters.grouping, "monthly");
    assert!(long_report.yearly_overview.is_some());
    assert_eq!(
        long_report.yearly_overview.unwrap().currency_summaries[0]
            .months
            .len(),
        12
    );

    db.close().await;
}

#[tokio::test]
async fn reports_aggregate_categories_budgets_bills_and_savings_contributions() {
    let db = test_db::create_test_db().await;
    let account = create_account(&db.pool, "Checking", "MAD").await;
    let income = create_category(&db.pool, "Salary", "income").await;
    let food = create_category(&db.pool, "Food", "expense").await;

    create_transaction(
        &db.pool,
        &account.id,
        &income.id,
        "income",
        100_000,
        "2026-06-02",
    )
    .await;
    create_transaction(
        &db.pool,
        &account.id,
        &food.id,
        "expense",
        90_000,
        "2026-06-03",
    )
    .await;

    wallet_lib::domain::budgets::service::BudgetService::create(
        &db.pool,
        wallet_lib::domain::budgets::dto::CreateBudgetRequest {
            name: "Food budget".to_string(),
            category_id: food.id.clone(),
            amount_minor: 80_000,
            month: 6,
            year: 2026,
        },
    )
    .await
    .unwrap();

    RecurringBillService::create(
        &db.pool,
        CreateRecurringBillRequest {
            name: "Internet".to_string(),
            account_id: account.id.clone(),
            category_id: food.id.clone(),
            amount_minor: 20_000,
            frequency: "monthly".to_string(),
            next_due_date: "2026-06-20".to_string(),
            description: None,
        },
    )
    .await
    .unwrap();

    let goal = SavingsGoalService::create(
        &db.pool,
        CreateSavingsGoalRequest {
            name: "Emergency".to_string(),
            target_amount_minor: 200_000,
            current_amount_minor: Some(0),
            deadline_date: None,
        },
    )
    .await
    .unwrap();
    SavingsGoalService::contribute(
        &db.pool,
        ContributeToSavingsGoalRequest {
            savings_goal_id: goal.id,
            account_id: account.id,
            amount_minor: 10_000,
            transaction_date: Some("2026-06-04".to_string()),
            description: None,
        },
    )
    .await
    .unwrap();

    let report = ReportService::summary(&db.pool, request("2026-06-01", "2026-06-30"))
        .await
        .unwrap();

    assert_eq!(report.income_categories[0].total_minor, 100_000);
    assert_eq!(report.expense_categories[0].category_name, "Food");
    assert_eq!(report.budget_performance[0].status, "Over budget");
    assert_eq!(report.budget_performance[0].over_budget_minor, 10_000);
    assert_eq!(report.recurring_bills[0].expected_bills, 1);
    assert_eq!(report.recurring_bills[0].paid_bills, 0);
    assert_eq!(
        report.savings_goals.recorded_contributions[0].amount_minor,
        10_000
    );
    assert_eq!(
        report.savings_goals.recorded_contributions[0].transaction_count,
        1
    );

    db.close().await;
}

fn request(start_date: &str, end_date: &str) -> ReportRequest {
    ReportRequest {
        start_date: start_date.to_string(),
        end_date: end_date.to_string(),
        account_id: None,
        category_id: None,
        transaction_type: None,
        currency: None,
    }
}

async fn create_account(
    pool: &sqlx::SqlitePool,
    name: &str,
    currency: &str,
) -> wallet_lib::domain::accounts::model::Account {
    AccountService::create(
        pool,
        CreateAccountRequest {
            name: name.to_string(),
            account_type: Some("cash".to_string()),
            currency: Some(currency.to_string()),
            initial_balance_minor: Some(0),
        },
    )
    .await
    .unwrap()
}

async fn create_category(
    pool: &sqlx::SqlitePool,
    name: &str,
    category_type: &str,
) -> wallet_lib::domain::categories::model::Category {
    CategoryService::create(
        pool,
        CreateCategoryRequest {
            name: name.to_string(),
            category_type: category_type.to_string(),
            icon: None,
            color: None,
        },
    )
    .await
    .unwrap()
}

async fn create_transaction(
    pool: &sqlx::SqlitePool,
    account_id: &str,
    category_id: &str,
    transaction_type: &str,
    amount_minor: i64,
    transaction_date: &str,
) {
    TransactionService::create(
        pool,
        CreateTransactionRequest {
            account_id: account_id.to_string(),
            category_id: category_id.to_string(),
            transaction_type: transaction_type.to_string(),
            amount_minor,
            description: None,
            transaction_date: transaction_date.to_string(),
        },
    )
    .await
    .unwrap();
}
