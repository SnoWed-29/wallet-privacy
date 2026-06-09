use chrono::Utc;
use sqlx::SqlitePool;
use uuid::Uuid;

use crate::domain::transactions::model::Transaction;
use crate::errors::app_error::AppError;

pub struct TransactionRepository;

impl TransactionRepository {
    pub async fn create(
        pool: &SqlitePool,
        account_id: String,
        category_id: String,
        transaction_type: String,
        amount_minor: i64,
        description: Option<String>,
        transaction_date: String,
    ) -> Result<Transaction, AppError> {
        let now = Utc::now().to_rfc3339();
        let transaction = Transaction {
            id: Uuid::new_v4().to_string(),
            account_id,
            category_id,
            transaction_type,
            amount_minor,
            description,
            transaction_date,
            created_at: now.clone(),
            updated_at: now,
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
        .bind(&transaction.id)
        .bind(&transaction.account_id)
        .bind(&transaction.category_id)
        .bind(&transaction.transaction_type)
        .bind(transaction.amount_minor)
        .bind(&transaction.description)
        .bind(&transaction.transaction_date)
        .bind(&transaction.created_at)
        .bind(&transaction.updated_at)
        .execute(pool)
        .await?;

        Ok(transaction)
    }

    pub async fn list(pool: &SqlitePool) -> Result<Vec<Transaction>, AppError> {
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

    pub async fn find_by_id(pool: &SqlitePool, id: &str) -> Result<Option<Transaction>, AppError> {
        let transaction = sqlx::query_as::<_, Transaction>(
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
            WHERE id = ?
            "#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(transaction)
    }

    pub async fn update(
        pool: &SqlitePool,
        id: String,
        account_id: String,
        category_id: String,
        transaction_type: String,
        amount_minor: i64,
        description: Option<String>,
        transaction_date: String,
    ) -> Result<Transaction, AppError> {
        let updated_at = Utc::now().to_rfc3339();

        sqlx::query(
            r#"
            UPDATE transactions
            SET
                account_id = ?,
                category_id = ?,
                transaction_type = ?,
                amount_minor = ?,
                description = ?,
                transaction_date = ?,
                updated_at = ?
            WHERE id = ?
            "#,
        )
        .bind(account_id)
        .bind(category_id)
        .bind(transaction_type)
        .bind(amount_minor)
        .bind(description)
        .bind(transaction_date)
        .bind(updated_at)
        .bind(&id)
        .execute(pool)
        .await?;

        Self::find_by_id(pool, &id)
            .await?
            .ok_or_else(|| AppError::Validation("Transaction does not exist.".to_string()))
    }

    pub async fn delete(pool: &SqlitePool, id: &str) -> Result<u64, AppError> {
        let result = sqlx::query(
            r#"
            DELETE FROM transactions
            WHERE id = ?
            "#,
        )
        .bind(id)
        .execute(pool)
        .await?;

        Ok(result.rows_affected())
    }
}
