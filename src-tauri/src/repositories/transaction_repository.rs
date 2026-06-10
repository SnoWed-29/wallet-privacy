use chrono::Utc;
use sqlx::{QueryBuilder, Sqlite, SqlitePool};
use uuid::Uuid;

use crate::domain::transactions::model::Transaction;
use crate::errors::app_error::AppError;

pub struct TransactionRepository;

pub struct TransactionUpdate {
    pub id: String,
    pub account_id: String,
    pub category_id: String,
    pub transaction_type: String,
    pub amount_minor: i64,
    pub description: Option<String>,
    pub transaction_date: String,
}

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

    pub async fn filter(
        pool: &SqlitePool,
        account_id: Option<String>,
        category_id: Option<String>,
        transaction_type: Option<String>,
        start_date: Option<String>,
        end_date: Option<String>,
        search: Option<String>,
    ) -> Result<Vec<Transaction>, AppError> {
        let mut query = QueryBuilder::<Sqlite>::new(
            r#"
            SELECT
                transactions.id,
                transactions.account_id,
                transactions.category_id,
                transactions.transaction_type,
                transactions.amount_minor,
                transactions.description,
                transactions.transaction_date,
                transactions.created_at,
                transactions.updated_at
            FROM transactions
            INNER JOIN accounts ON accounts.id = transactions.account_id
            INNER JOIN categories ON categories.id = transactions.category_id
            WHERE 1 = 1
            "#,
        );

        if let Some(account_id) = account_id {
            query
                .push(" AND transactions.account_id = ")
                .push_bind(account_id);
        }

        if let Some(category_id) = category_id {
            query
                .push(" AND transactions.category_id = ")
                .push_bind(category_id);
        }

        if let Some(transaction_type) = transaction_type {
            query
                .push(" AND transactions.transaction_type = ")
                .push_bind(transaction_type);
        }

        if let Some(start_date) = start_date {
            query
                .push(" AND transactions.transaction_date >= ")
                .push_bind(start_date);
        }

        if let Some(end_date) = end_date {
            query
                .push(" AND transactions.transaction_date <= ")
                .push_bind(end_date);
        }

        if let Some(search) = search {
            let search_pattern = format!("%{}%", search);
            query.push(
                r#"
                AND (
                    LOWER(COALESCE(transactions.description, '')) LIKE LOWER(
                "#,
            );
            query.push_bind(search_pattern.clone());
            query.push(") OR LOWER(accounts.name) LIKE LOWER(");
            query.push_bind(search_pattern.clone());
            query.push(") OR LOWER(categories.name) LIKE LOWER(");
            query.push_bind(search_pattern);
            query.push("))");
        }

        query.push(" ORDER BY transactions.transaction_date DESC, transactions.created_at DESC");

        let transactions = query
            .build_query_as::<Transaction>()
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
        update: TransactionUpdate,
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
        .bind(update.account_id)
        .bind(update.category_id)
        .bind(update.transaction_type)
        .bind(update.amount_minor)
        .bind(update.description)
        .bind(update.transaction_date)
        .bind(updated_at)
        .bind(&update.id)
        .execute(pool)
        .await?;

        Self::find_by_id(pool, &update.id)
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
