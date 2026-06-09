use chrono::Utc;
use sqlx::SqlitePool;
use uuid::Uuid;

use crate::domain::savings_goals::model::SavingsGoal;
use crate::errors::app_error::AppError;

pub struct SavingsGoalRepository;

impl SavingsGoalRepository {
    pub async fn create(
        pool: &SqlitePool,
        name: String,
        target_amount_minor: i64,
        current_amount_minor: i64,
        deadline_date: Option<String>,
    ) -> Result<SavingsGoal, AppError> {
        let now = Utc::now().to_rfc3339();
        let id = Uuid::new_v4().to_string();

        sqlx::query(
            r#"
            INSERT INTO savings_goals (
                id,
                name,
                target_amount_minor,
                current_amount_minor,
                deadline_date,
                is_archived,
                created_at,
                updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&id)
        .bind(name)
        .bind(target_amount_minor)
        .bind(current_amount_minor)
        .bind(deadline_date)
        .bind(false)
        .bind(&now)
        .bind(&now)
        .execute(pool)
        .await?;

        Self::find_by_id(pool, &id)
            .await?
            .ok_or_else(|| AppError::Validation("Savings goal does not exist.".to_string()))
    }

    pub async fn list(pool: &SqlitePool) -> Result<Vec<SavingsGoal>, AppError> {
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
            WHERE is_archived = 0
            ORDER BY created_at DESC
            "#,
        )
        .fetch_all(pool)
        .await?;

        Ok(goals)
    }

    pub async fn find_by_id(pool: &SqlitePool, id: &str) -> Result<Option<SavingsGoal>, AppError> {
        let goal = sqlx::query_as::<_, SavingsGoal>(
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
            WHERE id = ?
            "#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(goal)
    }

    pub async fn update(
        pool: &SqlitePool,
        id: String,
        name: String,
        target_amount_minor: i64,
        current_amount_minor: i64,
        deadline_date: Option<String>,
    ) -> Result<SavingsGoal, AppError> {
        let updated_at = Utc::now().to_rfc3339();

        sqlx::query(
            r#"
            UPDATE savings_goals
            SET
                name = ?,
                target_amount_minor = ?,
                current_amount_minor = ?,
                deadline_date = ?,
                updated_at = ?
            WHERE id = ?
            "#,
        )
        .bind(name)
        .bind(target_amount_minor)
        .bind(current_amount_minor)
        .bind(deadline_date)
        .bind(updated_at)
        .bind(&id)
        .execute(pool)
        .await?;

        Self::find_by_id(pool, &id)
            .await?
            .ok_or_else(|| AppError::Validation("Savings goal does not exist.".to_string()))
    }

    pub async fn archive(pool: &SqlitePool, id: &str) -> Result<u64, AppError> {
        let updated_at = Utc::now().to_rfc3339();
        let result = sqlx::query(
            r#"
            UPDATE savings_goals
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

    pub async fn contribute(
        pool: &SqlitePool,
        savings_goal_id: &str,
        account_id: &str,
        goal_name: &str,
        amount_minor: i64,
        transaction_date: String,
        description: String,
    ) -> Result<SavingsGoal, AppError> {
        let mut transaction = pool.begin().await?;
        let now = Utc::now().to_rfc3339();

        let category_id: Option<String> = sqlx::query_scalar(
            r#"
            SELECT id
            FROM categories
            WHERE name = ? AND category_type = 'expense' AND is_archived = 0
            ORDER BY created_at DESC
            LIMIT 1
            "#,
        )
        .bind("Savings Goal Contributions")
        .fetch_optional(&mut *transaction)
        .await?;

        let category_id = match category_id {
            Some(category_id) => category_id,
            None => {
                let category_id = Uuid::new_v4().to_string();
                sqlx::query(
                    r#"
                    INSERT INTO categories (
                        id,
                        name,
                        category_type,
                        icon,
                        color,
                        is_archived,
                        created_at,
                        updated_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    "#,
                )
                .bind(&category_id)
                .bind("Savings Goal Contributions")
                .bind("expense")
                .bind(Option::<String>::None)
                .bind(Option::<String>::None)
                .bind(false)
                .bind(&now)
                .bind(&now)
                .execute(&mut *transaction)
                .await?;

                category_id
            }
        };

        sqlx::query(
            r#"
            INSERT INTO transactions (
                id,
                account_id,
                category_id,
                transaction_type,
                amount_minor,
                description,
                transaction_date,
                created_at,
                updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(Uuid::new_v4().to_string())
        .bind(account_id)
        .bind(category_id)
        .bind("expense")
        .bind(amount_minor)
        .bind(description)
        .bind(transaction_date)
        .bind(&now)
        .bind(&now)
        .execute(&mut *transaction)
        .await?;

        sqlx::query(
            r#"
            UPDATE savings_goals
            SET
                current_amount_minor = current_amount_minor + ?,
                updated_at = ?
            WHERE id = ?
            "#,
        )
        .bind(amount_minor)
        .bind(&now)
        .bind(savings_goal_id)
        .execute(&mut *transaction)
        .await?;

        transaction.commit().await?;

        Self::find_by_id(pool, savings_goal_id)
            .await?
            .ok_or_else(|| {
                AppError::Validation(format!("Savings goal '{goal_name}' does not exist."))
            })
    }
}
