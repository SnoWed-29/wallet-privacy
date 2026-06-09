use chrono::Utc;
use sqlx::SqlitePool;
use uuid::Uuid;

use crate::domain::budgets::model::Budget;
use crate::errors::app_error::AppError;

pub struct BudgetRepository;

impl BudgetRepository {
    pub async fn create(
        pool: &SqlitePool,
        name: String,
        category_id: String,
        amount_minor: i64,
        month: i64,
        year: i64,
    ) -> Result<Budget, AppError> {
        let now = Utc::now().to_rfc3339();
        let id = Uuid::new_v4().to_string();

        sqlx::query(
            r#"
            INSERT INTO budgets (
                id,
                name,
                category_id,
                amount_minor,
                month,
                year,
                is_archived,
                created_at,
                updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&id)
        .bind(name)
        .bind(category_id)
        .bind(amount_minor)
        .bind(month)
        .bind(year)
        .bind(false)
        .bind(&now)
        .bind(&now)
        .execute(pool)
        .await?;

        Self::find_by_id(pool, &id)
            .await?
            .ok_or_else(|| AppError::Validation("Budget does not exist.".to_string()))
    }

    pub async fn list(pool: &SqlitePool) -> Result<Vec<Budget>, AppError> {
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
            WHERE budgets.is_archived = 0
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

    pub async fn find_by_id(pool: &SqlitePool, id: &str) -> Result<Option<Budget>, AppError> {
        let budget = sqlx::query_as::<_, Budget>(
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
            WHERE budgets.id = ?
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
            "#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(budget)
    }

    pub async fn update(
        pool: &SqlitePool,
        id: String,
        name: String,
        category_id: String,
        amount_minor: i64,
        month: i64,
        year: i64,
    ) -> Result<Budget, AppError> {
        let updated_at = Utc::now().to_rfc3339();

        sqlx::query(
            r#"
            UPDATE budgets
            SET
                name = ?,
                category_id = ?,
                amount_minor = ?,
                month = ?,
                year = ?,
                updated_at = ?
            WHERE id = ?
            "#,
        )
        .bind(name)
        .bind(category_id)
        .bind(amount_minor)
        .bind(month)
        .bind(year)
        .bind(updated_at)
        .bind(&id)
        .execute(pool)
        .await?;

        Self::find_by_id(pool, &id)
            .await?
            .ok_or_else(|| AppError::Validation("Budget does not exist.".to_string()))
    }

    pub async fn archive(pool: &SqlitePool, id: &str) -> Result<u64, AppError> {
        let updated_at = Utc::now().to_rfc3339();
        let result = sqlx::query(
            r#"
            UPDATE budgets
            SET
                is_archived = 1,
                updated_at = ?
            WHERE id = ?
            "#,
        )
        .bind(updated_at)
        .bind(id)
        .execute(pool)
        .await?;

        Ok(result.rows_affected())
    }
}
