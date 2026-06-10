use wallet_lib::domain::accounts::service::AccountService;
use wallet_lib::domain::budgets::service::BudgetService;
use wallet_lib::domain::categories::dto::ArchiveCategoryRequest;
use wallet_lib::domain::categories::service::CategoryService;
use wallet_lib::domain::recurring_bills::dto::MarkRecurringBillPaidRequest;
use wallet_lib::domain::recurring_bills::service::RecurringBillService;
use wallet_lib::domain::savings_goals::dto::ContributeToSavingsGoalRequest;
use wallet_lib::domain::savings_goals::service::SavingsGoalService;
use wallet_lib::domain::transactions::dto::{DeleteTransactionRequest, UpdateTransactionRequest};
use wallet_lib::domain::transactions::service::TransactionService;

use crate::common::fixtures;
use crate::common::test_db;

#[tokio::test]
async fn create_account_category_and_income_transaction_updates_balance() {
    let db = test_db::create_test_db().await;
    let account = fixtures::create_account(&db.pool).await.unwrap();
    let category = fixtures::create_income_category(&db.pool).await.unwrap();

    let transaction = fixtures::create_income_transaction(&db.pool, &account.id, &category.id)
        .await
        .unwrap();
    let account = AccountService::list(&db.pool).await.unwrap().remove(0);

    assert_eq!(transaction.transaction_type, "income");
    assert_eq!(account.balance_minor, 30_000);
    db.close().await;
}

#[tokio::test]
async fn create_account_and_expense_transaction_updates_balance() {
    let db = test_db::create_test_db().await;
    let account = fixtures::create_account(&db.pool).await.unwrap();
    let category = fixtures::create_expense_category(&db.pool).await.unwrap();

    let transaction = fixtures::create_expense_transaction(&db.pool, &account.id, &category.id)
        .await
        .unwrap();
    let account = AccountService::list(&db.pool).await.unwrap().remove(0);

    assert_eq!(transaction.transaction_type, "expense");
    assert_eq!(account.balance_minor, 6_500);
    db.close().await;
}

#[tokio::test]
async fn monthly_budget_usage_updates_after_same_month_expense() {
    let db = test_db::create_test_db().await;
    let account = fixtures::create_account(&db.pool).await.unwrap();
    let category = fixtures::create_expense_category(&db.pool).await.unwrap();

    fixtures::create_budget(&db.pool, &category.id)
        .await
        .unwrap();
    fixtures::create_expense_transaction(&db.pool, &account.id, &category.id)
        .await
        .unwrap();

    let budget = BudgetService::list(&db.pool).await.unwrap().remove(0);

    assert_eq!(budget.spent_minor, 3_500);
    assert_eq!(budget.remaining_minor, 46_500);
    db.close().await;
}

#[tokio::test]
async fn recurring_bill_payment_creates_expense_transaction() {
    let db = test_db::create_test_db().await;
    let account = fixtures::create_account(&db.pool).await.unwrap();
    let category = fixtures::create_expense_category(&db.pool).await.unwrap();
    let bill = fixtures::create_recurring_bill(&db.pool, &account.id, &category.id)
        .await
        .unwrap();

    RecurringBillService::mark_paid(
        &db.pool,
        MarkRecurringBillPaidRequest {
            id: bill.id,
            paid_date: Some("2026-06-15".to_string()),
        },
    )
    .await
    .unwrap();

    let transactions = TransactionService::list(&db.pool).await.unwrap();
    assert_eq!(transactions.len(), 1);
    assert_eq!(transactions[0].category_id, category.id);
    assert_eq!(transactions[0].amount_minor, 2_500);
    db.close().await;
}

#[tokio::test]
async fn savings_goal_contribution_creates_contribution_transaction() {
    let db = test_db::create_test_db().await;
    let account = fixtures::create_account(&db.pool).await.unwrap();
    let goal = fixtures::create_savings_goal(&db.pool).await.unwrap();

    SavingsGoalService::contribute(
        &db.pool,
        ContributeToSavingsGoalRequest {
            savings_goal_id: goal.id,
            account_id: account.id,
            amount_minor: 5_000,
            transaction_date: Some("2026-06-10".to_string()),
            description: None,
        },
    )
    .await
    .unwrap();

    let transactions = TransactionService::list(&db.pool).await.unwrap();
    assert_eq!(transactions.len(), 1);
    assert_eq!(
        transactions[0].description,
        Some("Contribution to Emergency fund".to_string())
    );
    db.close().await;
}

#[tokio::test]
async fn update_delete_and_archive_entities_have_expected_effects() {
    let db = test_db::create_test_db().await;
    let account = fixtures::create_account(&db.pool).await.unwrap();
    let category = fixtures::create_expense_category(&db.pool).await.unwrap();
    let transaction = fixtures::create_expense_transaction(&db.pool, &account.id, &category.id)
        .await
        .unwrap();

    let updated = TransactionService::update(
        &db.pool,
        UpdateTransactionRequest {
            id: transaction.id.clone(),
            account_id: account.id,
            category_id: category.id.clone(),
            transaction_type: "expense".to_string(),
            amount_minor: 4_000,
            description: Some("updated".to_string()),
            transaction_date: "2026-06-11".to_string(),
        },
    )
    .await
    .unwrap();
    TransactionService::delete(&db.pool, DeleteTransactionRequest { id: transaction.id })
        .await
        .unwrap();
    CategoryService::archive(&db.pool, ArchiveCategoryRequest { id: category.id })
        .await
        .unwrap();

    assert_eq!(updated.amount_minor, 4_000);
    assert!(TransactionService::list(&db.pool).await.unwrap().is_empty());
    assert!(CategoryService::list(&db.pool).await.unwrap().is_empty());
    db.close().await;
}
