use chrono::Utc;
use sqlx::SqlitePool;
use uuid::Uuid;

use crate::domain::accounts::model::Account;
use crate::errors::app_error::AppError;

pub struct AccountRepository;

impl AccountRepository {
    pub async fn create(
        pool: &SqlitePool,
        name: String,
        account_type: String,
        currency: String,
        initial_balance_minor: i64,
    ) -> Result<Account, AppError> {
        let now = Utc::now().to_rfc3339();
        let account = Account {
            id: Uuid::new_v4().to_string(),
            name,
            account_type,
            currency,
            initial_balance_minor,
            balance_minor: initial_balance_minor,
            is_archived: false,
            created_at: now.clone(),
            updated_at: now,
        };

        sqlx::query(
            r#"
            INSERT INTO accounts (
                id,
                name,
                account_type,
                currency,
                initial_balance_minor,
                is_archived,
                created_at,
                updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&account.id)
        .bind(&account.name)
        .bind(&account.account_type)
        .bind(&account.currency)
        .bind(account.initial_balance_minor)
        .bind(account.is_archived)
        .bind(&account.created_at)
        .bind(&account.updated_at)
        .execute(pool)
        .await?;

        Ok(account)
    }

    pub async fn list(pool: &SqlitePool) -> Result<Vec<Account>, AppError> {
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
            WHERE accounts.is_archived = 0
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

    pub async fn find_by_id(pool: &SqlitePool, id: &str) -> Result<Option<Account>, AppError> {
        let account = sqlx::query_as::<_, Account>(
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
            WHERE accounts.id = ?
            GROUP BY
                accounts.id,
                accounts.name,
                accounts.account_type,
                accounts.currency,
                accounts.initial_balance_minor,
                accounts.is_archived,
                accounts.created_at,
                accounts.updated_at
            "#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(account)
    }
}
