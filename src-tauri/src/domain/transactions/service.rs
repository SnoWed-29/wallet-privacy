use sqlx::SqlitePool;

use crate::domain::transactions::dto::CreateTransactionRequest;
use crate::domain::transactions::model::Transaction;
use crate::errors::app_error::AppError;
use crate::repositories::account_repository::AccountRepository;
use crate::repositories::category_repository::CategoryRepository;
use crate::repositories::transaction_repository::TransactionRepository;

pub struct TransactionService;

impl TransactionService {
    pub async fn create(
        pool: &SqlitePool,
        request: CreateTransactionRequest,
    ) -> Result<Transaction, AppError> {
        let account_id = request.account_id.trim().to_string();
        if account_id.is_empty() {
            return Err(AppError::Validation("Account is required.".to_string()));
        }

        let category_id = request.category_id.trim().to_string();
        if category_id.is_empty() {
            return Err(AppError::Validation("Category is required.".to_string()));
        }

        let transaction_type = request.transaction_type.trim().to_lowercase();
        if transaction_type != "income" && transaction_type != "expense" {
            return Err(AppError::Validation(
                "Transaction type must be income or expense.".to_string(),
            ));
        }

        if request.amount_minor <= 0 {
            return Err(AppError::Validation(
                "Transaction amount must be greater than 0.".to_string(),
            ));
        }

        let transaction_date = request.transaction_date.trim().to_string();
        if transaction_date.is_empty() {
            return Err(AppError::Validation(
                "Transaction date is required.".to_string(),
            ));
        }

        let account = AccountRepository::find_by_id(pool, &account_id)
            .await?
            .ok_or_else(|| AppError::Validation("Account does not exist.".to_string()))?;
        if account.is_archived {
            return Err(AppError::Validation(
                "Archived accounts cannot receive new transactions.".to_string(),
            ));
        }

        let category = CategoryRepository::find_by_id(pool, &category_id)
            .await?
            .ok_or_else(|| AppError::Validation("Category does not exist.".to_string()))?;
        if category.is_archived {
            return Err(AppError::Validation(
                "Archived categories cannot be used.".to_string(),
            ));
        }
        if category.category_type != transaction_type {
            return Err(AppError::Validation(
                "Category type must match transaction type.".to_string(),
            ));
        }

        let description = empty_string_to_none(request.description);

        TransactionRepository::create(
            pool,
            account_id,
            category_id,
            transaction_type,
            request.amount_minor,
            description,
            transaction_date,
        )
        .await
    }

    pub async fn list(pool: &SqlitePool) -> Result<Vec<Transaction>, AppError> {
        TransactionRepository::list(pool).await
    }
}

fn empty_string_to_none(value: Option<String>) -> Option<String> {
    let value = value?.trim().to_string();
    if value.is_empty() {
        None
    } else {
        Some(value)
    }
}
