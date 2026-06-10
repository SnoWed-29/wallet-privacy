use chrono::Utc;
use sqlx::SqlitePool;
use uuid::Uuid;

use crate::domain::recurring_bills::model::RecurringBill;
use crate::errors::app_error::AppError;

pub struct RecurringBillRepository;

pub struct RecurringBillWrite {
    pub name: String,
    pub account_id: String,
    pub category_id: String,
    pub amount_minor: i64,
    pub frequency: String,
    pub next_due_date: String,
    pub description: Option<String>,
}

pub struct MarkRecurringBillPaid {
    pub bill_id: String,
    pub account_id: String,
    pub category_id: String,
    pub amount_minor: i64,
    pub paid_date: String,
    pub next_due_date: String,
    pub description: String,
}

impl RecurringBillRepository {
    pub async fn create(
        pool: &SqlitePool,
        bill: RecurringBillWrite,
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
        .bind(bill.name)
        .bind(bill.account_id)
        .bind(bill.category_id)
        .bind(bill.amount_minor)
        .bind(bill.frequency)
        .bind(bill.next_due_date)
        .bind(Option::<String>::None)
        .bind(bill.description)
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
        bill: RecurringBillWrite,
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
        .bind(bill.name)
        .bind(bill.account_id)
        .bind(bill.category_id)
        .bind(bill.amount_minor)
        .bind(bill.frequency)
        .bind(bill.next_due_date)
        .bind(bill.description)
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
        payment: MarkRecurringBillPaid,
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
        .bind(&payment.account_id)
        .bind(&payment.category_id)
        .bind("expense")
        .bind(payment.amount_minor)
        .bind(&payment.description)
        .bind(&payment.paid_date)
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
        .bind(&payment.paid_date)
        .bind(&payment.next_due_date)
        .bind(&now)
        .bind(&payment.bill_id)
        .execute(&mut *transaction)
        .await?;

        transaction.commit().await?;

        Self::find_by_id(pool, &payment.bill_id)
            .await?
            .ok_or_else(|| AppError::Validation("Recurring bill does not exist.".to_string()))
    }
}
