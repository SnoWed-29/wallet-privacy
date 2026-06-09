use sqlx::SqlitePool;

use crate::domain::dashboard::dto::{
    DashboardAccount, DashboardBudget, DashboardRecentTransaction, DashboardRecurringBill,
    DashboardSavingsGoal,
};
use crate::errors::app_error::AppError;

pub struct DashboardRepository;

impl DashboardRepository {
    pub async fn accounts(pool: &SqlitePool) -> Result<Vec<DashboardAccount>, AppError> {
        let accounts = sqlx::query_as::<_, DashboardAccount>(
            r#"
            SELECT
                accounts.id,
                accounts.name,
                accounts.initial_balance_minor + COALESCE(SUM(
                    CASE
                        WHEN transactions.transaction_type = 'income' THEN transactions.amount_minor
                        WHEN transactions.transaction_type = 'expense' THEN -transactions.amount_minor
                        ELSE 0
                    END
                ), 0) AS balance_minor
            FROM accounts
            LEFT JOIN transactions ON transactions.account_id = accounts.id
            WHERE accounts.is_archived = 0
            GROUP BY accounts.id, accounts.name, accounts.initial_balance_minor
            ORDER BY accounts.created_at DESC
            "#,
        )
        .fetch_all(pool)
        .await?;

        Ok(accounts)
    }

    pub async fn monthly_total(
        pool: &SqlitePool,
        transaction_type: &str,
        start_date: &str,
        end_date: &str,
    ) -> Result<i64, AppError> {
        let total = sqlx::query_scalar::<_, i64>(
            r#"
            SELECT COALESCE(SUM(amount_minor), 0)
            FROM transactions
            WHERE transaction_type = ?
                AND transaction_date >= ?
                AND transaction_date < ?
            "#,
        )
        .bind(transaction_type)
        .bind(start_date)
        .bind(end_date)
        .fetch_one(pool)
        .await?;

        Ok(total)
    }

    pub async fn recent_transactions(
        pool: &SqlitePool,
    ) -> Result<Vec<DashboardRecentTransaction>, AppError> {
        let transactions = sqlx::query_as::<_, DashboardRecentTransaction>(
            r#"
            SELECT
                transactions.amount_minor,
                transactions.transaction_type,
                categories.name AS category_name,
                accounts.name AS account_name,
                transactions.description,
                transactions.transaction_date
            FROM transactions
            INNER JOIN accounts ON accounts.id = transactions.account_id
            INNER JOIN categories ON categories.id = transactions.category_id
            ORDER BY transactions.transaction_date DESC, transactions.created_at DESC
            LIMIT 10
            "#,
        )
        .fetch_all(pool)
        .await?;

        Ok(transactions)
    }

    pub async fn active_budgets(
        pool: &SqlitePool,
        month: i64,
        year: i64,
    ) -> Result<Vec<DashboardBudget>, AppError> {
        let budgets = sqlx::query_as::<_, DashboardBudget>(
            r#"
            SELECT
                budgets.name,
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
                ), 0) * 100.0 / budgets.amount_minor >= 100 AS is_exceeded
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
            WHERE budgets.is_archived = 0
                AND budgets.month = ?
                AND budgets.year = ?
            GROUP BY budgets.id, budgets.name, categories.name, budgets.amount_minor
            ORDER BY progress_percentage DESC, budgets.created_at DESC
            "#,
        )
        .bind(month)
        .bind(year)
        .fetch_all(pool)
        .await?;

        Ok(budgets)
    }

    pub async fn upcoming_recurring_bills(
        pool: &SqlitePool,
        today: &str,
        end_date: &str,
    ) -> Result<Vec<DashboardRecurringBill>, AppError> {
        let bills = sqlx::query_as::<_, DashboardRecurringBill>(
            r#"
            SELECT
                name,
                amount_minor,
                next_due_date,
                CAST(julianday(next_due_date) - julianday(?) AS INTEGER) AS days_remaining
            FROM recurring_bills
            WHERE is_archived = 0
                AND next_due_date >= ?
                AND next_due_date <= ?
            ORDER BY next_due_date ASC, created_at DESC
            "#,
        )
        .bind(today)
        .bind(today)
        .bind(end_date)
        .fetch_all(pool)
        .await?;

        Ok(bills)
    }

    pub async fn active_savings_goals(
        pool: &SqlitePool,
    ) -> Result<Vec<DashboardSavingsGoal>, AppError> {
        let goals = sqlx::query_as::<_, DashboardSavingsGoal>(
            r#"
            SELECT
                name,
                target_amount_minor,
                current_amount_minor,
                target_amount_minor - current_amount_minor AS remaining_amount_minor,
                current_amount_minor * 100 / target_amount_minor AS progress_percent
            FROM savings_goals
            WHERE is_archived = 0
            ORDER BY progress_percent DESC, created_at DESC
            "#,
        )
        .fetch_all(pool)
        .await?;

        Ok(goals)
    }
}
