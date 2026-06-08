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
                id,
                name,
                account_type,
                currency,
                initial_balance_minor,
                is_archived,
                created_at,
                updated_at
            FROM accounts
            WHERE is_archived = 0
            ORDER BY created_at DESC
            "#,
        )
        .fetch_all(pool)
        .await?;

        Ok(accounts)
    }
}
