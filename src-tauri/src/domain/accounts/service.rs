use sqlx::SqlitePool;

use crate::domain::accounts::dto::{
    ArchiveAccountRequest, CreateAccountRequest, UpdateAccountRequest,
};
use crate::domain::accounts::model::Account;
use crate::errors::app_error::AppError;
use crate::repositories::account_repository::AccountRepository;

pub struct AccountService;

impl AccountService {
    pub async fn create(
        pool: &SqlitePool,
        request: CreateAccountRequest,
    ) -> Result<Account, AppError> {
        let name = request.name.trim().to_string();
        if name.is_empty() {
            return Err(AppError::Validation(
                "Account name is required.".to_string(),
            ));
        }

        let initial_balance_minor = request.initial_balance_minor.unwrap_or(0);
        if initial_balance_minor < 0 {
            return Err(AppError::Validation(
                "Initial balance cannot be negative.".to_string(),
            ));
        }

        let currency = request.currency.unwrap_or_default().trim().to_uppercase();
        let currency = if currency.is_empty() {
            "MAD".to_string()
        } else {
            currency
        };

        let account_type = request
            .account_type
            .unwrap_or_default()
            .trim()
            .to_lowercase();
        let account_type = if account_type.is_empty() {
            "cash".to_string()
        } else {
            account_type
        };

        AccountRepository::create(pool, name, account_type, currency, initial_balance_minor).await
    }

    pub async fn list(pool: &SqlitePool) -> Result<Vec<Account>, AppError> {
        AccountRepository::list(pool).await
    }

    pub async fn update(
        pool: &SqlitePool,
        request: UpdateAccountRequest,
    ) -> Result<Account, AppError> {
        let id = request.id.trim().to_string();
        if id.is_empty() {
            return Err(AppError::Validation("Account id is required.".to_string()));
        }

        let existing = AccountRepository::find_by_id(pool, &id)
            .await?
            .ok_or_else(|| AppError::Validation("Account does not exist.".to_string()))?;

        let name = request.name.trim().to_string();
        if name.is_empty() {
            return Err(AppError::Validation(
                "Account name is required.".to_string(),
            ));
        }

        let account_type = request
            .account_type
            .unwrap_or(existing.account_type)
            .trim()
            .to_lowercase();
        let account_type = if account_type.is_empty() {
            "cash".to_string()
        } else {
            account_type
        };

        let currency = request
            .currency
            .unwrap_or(existing.currency)
            .trim()
            .to_uppercase();
        let currency = if currency.is_empty() {
            "MAD".to_string()
        } else {
            currency
        };

        AccountRepository::update(pool, id, name, account_type, currency).await
    }

    pub async fn archive(
        pool: &SqlitePool,
        request: ArchiveAccountRequest,
    ) -> Result<(), AppError> {
        let id = request.id.trim().to_string();
        if id.is_empty() {
            return Err(AppError::Validation("Account id is required.".to_string()));
        }

        let archived_count = AccountRepository::archive(pool, &id).await?;
        if archived_count == 0 {
            return Err(AppError::Validation("Account does not exist.".to_string()));
        }

        Ok(())
    }
}
