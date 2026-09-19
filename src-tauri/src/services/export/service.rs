use chrono::Utc;
use sqlx::SqlitePool;

use crate::domain::accounts::model::Account;
use crate::domain::budgets::model::Budget;
use crate::domain::categories::model::Category;
use crate::domain::recurring_bills::model::RecurringBill;
use crate::domain::savings_goals::model::SavingsGoal;
use crate::domain::transactions::model::Transaction;
use crate::errors::app_error::AppError;

use super::dto::{WalletExport, EXPORT_VERSION};

pub struct ExportService;

impl ExportService {
    pub fn build_export(
        exported_at: String,
        accounts: Vec<Account>,
        categories: Vec<Category>,
        transactions: Vec<Transaction>,
        budgets: Vec<Budget>,
        recurring_bills: Vec<RecurringBill>,
        savings_goals: Vec<SavingsGoal>,
    ) -> WalletExport {
        WalletExport {
            version: EXPORT_VERSION.to_string(),
            exported_at,
            accounts,
            categories,
            transactions,
            budgets,
            recurring_bills,
            savings_goals,
        }
    }

    pub async fn export(pool: &SqlitePool) -> Result<WalletExport, AppError> {
        let accounts = list_accounts_for_export(pool).await?;
        let categories = list_categories_for_export(pool).await?;
        let transactions = list_transactions_for_export(pool).await?;
        let budgets = list_budgets_for_export(pool).await?;
        let recurring_bills = list_recurring_bills_for_export(pool).await?;
        let savings_goals = list_savings_goals_for_export(pool).await?;

        Ok(Self::build_export(
            Utc::now().to_rfc3339(),
            accounts,
            categories,
            transactions,
            budgets,
            recurring_bills,
            savings_goals,
        ))
    }

    pub async fn export_json(pool: &SqlitePool) -> Result<String, AppError> {
        let export = Self::export(pool).await?;
        Ok(serde_json::to_string_pretty(&export)?)
    }
}

async fn list_accounts_for_export(pool: &SqlitePool) -> Result<Vec<Account>, AppError> {
    let accounts = sqlx::query_as::<_, Account>(
        r#"
        SELECT
            accounts.id,
            accounts.name,
            accounts.account_type,
            accounts.currency,
            accounts.initial_balance_minor,
            accounts.initial_balance_minor + COALESCE(SUM(
                CASE
                    WHEN transactions.transaction_type = 'income' THEN transactions.amount_minor
                    WHEN transactions.transaction_type = 'expense' THEN -transactions.amount_minor
                    ELSE 0
                END
            ), 0) AS balance_minor,
            accounts.is_archived,
            accounts.created_at,
            accounts.updated_at
        FROM accounts
        LEFT JOIN transactions ON transactions.account_id = accounts.id
        GROUP BY
            accounts.id,
            accounts.name,
            accounts.account_type,
            accounts.currency,
            accounts.initial_balance_minor,
            accounts.is_archived,
            accounts.created_at,
            accounts.updated_at
        ORDER BY accounts.created_at DESC
        "#,
    )
    .fetch_all(pool)
    .await?;

    Ok(accounts)
}

async fn list_categories_for_export(pool: &SqlitePool) -> Result<Vec<Category>, AppError> {
    let categories = sqlx::query_as::<_, Category>(
        r#"
        SELECT
            id,
            name,
            category_type,
            icon,
            color,
            is_archived,
            created_at,
            updated_at
        FROM categories
        ORDER BY created_at DESC
        "#,
    )
    .fetch_all(pool)
    .await?;

    Ok(categories)
}

async fn list_transactions_for_export(pool: &SqlitePool) -> Result<Vec<Transaction>, AppError> {
    let transactions = sqlx::query_as::<_, Transaction>(
        r#"
        SELECT
            id,
            account_id,
            category_id,
            transaction_type,
            amount_minor,
            description,
            transaction_date,
            created_at,
            updated_at
        FROM transactions
        ORDER BY transaction_date DESC, created_at DESC
        "#,
    )
    .fetch_all(pool)
    .await?;

    Ok(transactions)
}

async fn list_budgets_for_export(pool: &SqlitePool) -> Result<Vec<Budget>, AppError> {
    let budgets = sqlx::query_as::<_, Budget>(
        r#"
        SELECT
            budgets.id,
            budgets.name,
            budgets.category_id,
            categories.name AS category_name,
            budgets.amount_minor,
            COALESCE(SUM(
                CASE
                    WHEN transactions.transaction_type = 'expense' THEN transactions.amount_minor
                    ELSE 0
                END
            ), 0) AS spent_minor,
            budgets.amount_minor - COALESCE(SUM(
                CASE
                    WHEN transactions.transaction_type = 'expense' THEN transactions.amount_minor
                    ELSE 0
                END
            ), 0) AS remaining_minor,
            COALESCE(SUM(
                CASE
                    WHEN transactions.transaction_type = 'expense' THEN transactions.amount_minor
                    ELSE 0
                END
            ), 0) * 100.0 / budgets.amount_minor AS progress_percentage,
            COALESCE(SUM(
                CASE
                    WHEN transactions.transaction_type = 'expense' THEN transactions.amount_minor
                    ELSE 0
                END
            ), 0) * 100.0 / budgets.amount_minor >= 80 AS is_near_limit,
            COALESCE(SUM(
                CASE
                    WHEN transactions.transaction_type = 'expense' THEN transactions.amount_minor
                    ELSE 0
                END
            ), 0) * 100.0 / budgets.amount_minor >= 100 AS is_exceeded,
            budgets.month,
            budgets.year,
            budgets.is_archived,
            budgets.created_at,
            budgets.updated_at
        FROM budgets
        INNER JOIN categories ON categories.id = budgets.category_id
        LEFT JOIN transactions
            ON transactions.category_id = budgets.category_id
            AND transactions.transaction_type = 'expense'
            AND transactions.transaction_date >= printf('%04d-%02d-01', budgets.year, budgets.month)
            AND transactions.transaction_date < date(
                printf('%04d-%02d-01', budgets.year, budgets.month),
                '+1 month'
            )
        GROUP BY
            budgets.id,
            budgets.name,
            budgets.category_id,
            categories.name,
            budgets.amount_minor,
            budgets.month,
            budgets.year,
            budgets.is_archived,
            budgets.created_at,
            budgets.updated_at
        ORDER BY budgets.year DESC, budgets.month DESC, budgets.created_at DESC
        "#,
    )
    .fetch_all(pool)
    .await?;

    Ok(budgets)
}

async fn list_recurring_bills_for_export(
    pool: &SqlitePool,
) -> Result<Vec<RecurringBill>, AppError> {
    let bills = sqlx::query_as::<_, RecurringBill>(
        r#"
        SELECT
            recurring_bills.id,
            recurring_bills.name,
            recurring_bills.account_id,
            accounts.name AS account_name,
            recurring_bills.category_id,
            categories.name AS category_name,
            recurring_bills.amount_minor,
            recurring_bills.frequency,
            recurring_bills.next_due_date,
            recurring_bills.last_paid_date,
            recurring_bills.description,
            recurring_bills.is_archived,
            recurring_bills.created_at,
            recurring_bills.updated_at
        FROM recurring_bills
        INNER JOIN accounts ON accounts.id = recurring_bills.account_id
        INNER JOIN categories ON categories.id = recurring_bills.category_id
        ORDER BY recurring_bills.next_due_date ASC, recurring_bills.created_at DESC
        "#,
    )
    .fetch_all(pool)
    .await?;

    Ok(bills)
}

async fn list_savings_goals_for_export(pool: &SqlitePool) -> Result<Vec<SavingsGoal>, AppError> {
    let goals = sqlx::query_as::<_, SavingsGoal>(
        r#"
        SELECT
            id,
            name,
            target_amount_minor,
            current_amount_minor,
            target_amount_minor - current_amount_minor AS remaining_amount_minor,
            MIN(100, current_amount_minor * 100 / target_amount_minor) AS progress_percent,
            deadline_date,
            is_archived,
            created_at,
            updated_at
        FROM savings_goals
        ORDER BY created_at DESC
        "#,
    )
    .fetch_all(pool)
    .await?;

    Ok(goals)
}
