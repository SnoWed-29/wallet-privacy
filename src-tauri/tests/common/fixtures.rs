use wallet_lib::domain::accounts::dto::CreateAccountRequest;
use wallet_lib::domain::accounts::model::Account;
use wallet_lib::domain::accounts::service::AccountService;
use wallet_lib::domain::budgets::dto::CreateBudgetRequest;
use wallet_lib::domain::budgets::model::Budget;
use wallet_lib::domain::budgets::service::BudgetService;
use wallet_lib::domain::categories::dto::CreateCategoryRequest;
use wallet_lib::domain::categories::model::Category;
use wallet_lib::domain::categories::service::CategoryService;
use wallet_lib::domain::recurring_bills::dto::CreateRecurringBillRequest;
use wallet_lib::domain::recurring_bills::model::RecurringBill;
use wallet_lib::domain::recurring_bills::service::RecurringBillService;
use wallet_lib::domain::savings_goals::dto::CreateSavingsGoalRequest;
use wallet_lib::domain::savings_goals::model::SavingsGoal;
use wallet_lib::domain::savings_goals::service::SavingsGoalService;
use wallet_lib::domain::transactions::dto::CreateTransactionRequest;
use wallet_lib::domain::transactions::model::Transaction;
use wallet_lib::domain::transactions::service::TransactionService;
use wallet_lib::errors::app_error::AppError;

pub fn account_request(name: &str) -> CreateAccountRequest {
    CreateAccountRequest {
        name: name.to_string(),
        account_type: Some("cash".to_string()),
        currency: Some("MAD".to_string()),
        initial_balance_minor: Some(10_000),
    }
}

pub fn category_request(name: &str, category_type: &str) -> CreateCategoryRequest {
    CreateCategoryRequest {
        name: name.to_string(),
        category_type: category_type.to_string(),
        icon: None,
        color: None,
    }
}

pub fn transaction_request(
    account_id: &str,
    category_id: &str,
    transaction_type: &str,
    amount_minor: i64,
) -> CreateTransactionRequest {
    CreateTransactionRequest {
        account_id: account_id.to_string(),
        category_id: category_id.to_string(),
        transaction_type: transaction_type.to_string(),
        amount_minor,
        description: Some("fixture transaction".to_string()),
        transaction_date: "2026-06-10".to_string(),
    }
}

pub fn budget_request(category_id: &str, month: i64, year: i64) -> CreateBudgetRequest {
    CreateBudgetRequest {
        name: "Groceries budget".to_string(),
        category_id: category_id.to_string(),
        amount_minor: 50_000,
        month,
        year,
    }
}

pub fn recurring_bill_request(account_id: &str, category_id: &str) -> CreateRecurringBillRequest {
    CreateRecurringBillRequest {
        name: "Internet".to_string(),
        account_id: account_id.to_string(),
        category_id: category_id.to_string(),
        amount_minor: 2_500,
        frequency: "monthly".to_string(),
        next_due_date: "2026-06-15".to_string(),
        description: None,
    }
}

pub fn savings_goal_request(name: &str) -> CreateSavingsGoalRequest {
    CreateSavingsGoalRequest {
        name: name.to_string(),
        target_amount_minor: 100_000,
        current_amount_minor: Some(10_000),
        deadline_date: Some("2026-12-31".to_string()),
    }
}

pub async fn create_account(pool: &sqlx::SqlitePool) -> Result<Account, AppError> {
    AccountService::create(pool, account_request("Checking")).await
}

pub async fn create_income_category(pool: &sqlx::SqlitePool) -> Result<Category, AppError> {
    CategoryService::create(pool, category_request("Salary", "income")).await
}

pub async fn create_expense_category(pool: &sqlx::SqlitePool) -> Result<Category, AppError> {
    CategoryService::create(pool, category_request("Groceries", "expense")).await
}

pub async fn create_income_transaction(
    pool: &sqlx::SqlitePool,
    account_id: &str,
    category_id: &str,
) -> Result<Transaction, AppError> {
    TransactionService::create(
        pool,
        transaction_request(account_id, category_id, "income", 20_000),
    )
    .await
}

pub async fn create_expense_transaction(
    pool: &sqlx::SqlitePool,
    account_id: &str,
    category_id: &str,
) -> Result<Transaction, AppError> {
    TransactionService::create(
        pool,
        transaction_request(account_id, category_id, "expense", 3_500),
    )
    .await
}

pub async fn create_budget(pool: &sqlx::SqlitePool, category_id: &str) -> Result<Budget, AppError> {
    BudgetService::create(pool, budget_request(category_id, 6, 2026)).await
}

pub async fn create_recurring_bill(
    pool: &sqlx::SqlitePool,
    account_id: &str,
    category_id: &str,
) -> Result<RecurringBill, AppError> {
    RecurringBillService::create(pool, recurring_bill_request(account_id, category_id)).await
}

pub async fn create_savings_goal(pool: &sqlx::SqlitePool) -> Result<SavingsGoal, AppError> {
    SavingsGoalService::create(pool, savings_goal_request("Emergency fund")).await
}
