use chrono::Utc;
use sqlx::SqlitePool;
use uuid::Uuid;

use crate::domain::recurring_bills::model::RecurringBill;
use crate::errors::app_error::AppError;

pub struct RecurringBillRepository;

impl RecurringBillRepository {
    pub async fn create(
        pool: &SqlitePool,
        name: String,
        account_id: String,
        category_id: String,
        amount_minor: i64,
        frequency: String,
        next_due_date: String,
        description: Option<String>,
    ) -> Result<RecurringBill, AppError> {
        let now = Utc::now().to_rfc3339();
        let id = Uuid::new_v4().to_string();

        sqlx::query(
            r#"
            INSERT INTO recurring_bills (
                id,
                name,
                account_id,
                category_id,
                amount_minor,
                frequency,
                next_due_date,
                last_paid_date,
                description,
                is_archived,
                created_at,
                updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&id)
        .bind(name)
        .bind(account_id)
        .bind(category_id)
        .bind(amount_minor)
        .bind(frequency)
        .bind(next_due_date)
        .bind(Option::<String>::None)
        .bind(description)
        .bind(false)
        .bind(&now)
        .bind(&now)
        .execute(pool)
        .await?;

        Self::find_by_id(pool, &id)
            .await?
            .ok_or_else(|| AppError::Validation("Recurring bill does not exist.".to_string()))
    }

    pub async fn list(pool: &SqlitePool) -> Result<Vec<RecurringBill>, AppError> {
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
            WHERE recurring_bills.is_archived = 0
            ORDER BY recurring_bills.next_due_date ASC, recurring_bills.created_at DESC
            "#,
        )
        .fetch_all(pool)
        .await?;

        Ok(bills)
    }

    pub async fn find_by_id(
        pool: &SqlitePool,
        id: &str,
    ) -> Result<Option<RecurringBill>, AppError> {
        let bill = sqlx::query_as::<_, RecurringBill>(
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
            WHERE recurring_bills.id = ?
            "#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(bill)
    }

    pub async fn update(
        pool: &SqlitePool,
        id: String,
        name: String,
        account_id: String,
        category_id: String,
        amount_minor: i64,
        frequency: String,
        next_due_date: String,
        description: Option<String>,
    ) -> Result<RecurringBill, AppError> {
        let updated_at = Utc::now().to_rfc3339();

        sqlx::query(
            r#"
            UPDATE recurring_bills
            SET
                name = ?,
                account_id = ?,
                category_id = ?,
                amount_minor = ?,
                frequency = ?,
                next_due_date = ?,
                description = ?,
                updated_at = ?
            WHERE id = ?
            "#,
        )
        .bind(name)
        .bind(account_id)
        .bind(category_id)
        .bind(amount_minor)
        .bind(frequency)
        .bind(next_due_date)
        .bind(description)
        .bind(updated_at)
        .bind(&id)
        .execute(pool)
        .await?;

        Self::find_by_id(pool, &id)
            .await?
            .ok_or_else(|| AppError::Validation("Recurring bill does not exist.".to_string()))
    }

    pub async fn archive(pool: &SqlitePool, id: &str) -> Result<u64, AppError> {
        let updated_at = Utc::now().to_rfc3339();
        let result = sqlx::query(
            r#"
            UPDATE recurring_bills
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

    pub async fn mark_paid(
        pool: &SqlitePool,
        bill_id: &str,
        account_id: &str,
        category_id: &str,
        amount_minor: i64,
        paid_date: String,
        next_due_date: String,
        description: String,
    ) -> Result<RecurringBill, AppError> {
        let mut transaction = pool.begin().await?;
        let now = Utc::now().to_rfc3339();

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
        .bind(&paid_date)
        .bind(&now)
        .bind(&now)
        .execute(&mut *transaction)
        .await?;

        sqlx::query(
            r#"
            UPDATE recurring_bills
            SET
                last_paid_date = ?,
                next_due_date = ?,
                updated_at = ?
            WHERE id = ?
            "#,
        )
        .bind(paid_date)
        .bind(next_due_date)
        .bind(&now)
        .bind(bill_id)
        .execute(&mut *transaction)
        .await?;

        transaction.commit().await?;

        Self::find_by_id(pool, bill_id)
            .await?
            .ok_or_else(|| AppError::Validation("Recurring bill does not exist.".to_string()))
    }
}
