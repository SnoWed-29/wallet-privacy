use sqlx::SqlitePool;

use crate::domain::transactions::dto::{
    CreateTransactionRequest, DeleteTransactionRequest, TransactionFilterRequest,
    UpdateTransactionRequest,
};
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
        let validated = validate_transaction_fields(
            pool,
            request.account_id,
            request.category_id,
            request.transaction_type,
            request.amount_minor,
            request.description,
            request.transaction_date,
        )
        .await?;

        TransactionRepository::create(
            pool,
            validated.account_id,
            validated.category_id,
            validated.transaction_type,
            request.amount_minor,
            validated.description,
            validated.transaction_date,
        )
        .await
    }

    pub async fn update(
        pool: &SqlitePool,
        request: UpdateTransactionRequest,
    ) -> Result<Transaction, AppError> {
        let id = request.id.trim().to_string();
        if id.is_empty() {
            return Err(AppError::Validation(
                "Transaction id is required.".to_string(),
            ));
        }

        if TransactionRepository::find_by_id(pool, &id)
            .await?
            .is_none()
        {
            return Err(AppError::Validation(
                "Transaction does not exist.".to_string(),
            ));
        }

        let validated = validate_transaction_fields(
            pool,
            request.account_id,
            request.category_id,
            request.transaction_type,
            request.amount_minor,
            request.description,
            request.transaction_date,
        )
        .await?;

        TransactionRepository::update(
            pool,
            id,
            validated.account_id,
            validated.category_id,
            validated.transaction_type,
            request.amount_minor,
            validated.description,
            validated.transaction_date,
        )
        .await
    }

    pub async fn delete(
        pool: &SqlitePool,
        request: DeleteTransactionRequest,
    ) -> Result<(), AppError> {
        let id = request.id.trim().to_string();
        if id.is_empty() {
            return Err(AppError::Validation(
                "Transaction id is required.".to_string(),
            ));
        }

        let deleted_count = TransactionRepository::delete(pool, &id).await?;
        if deleted_count == 0 {
            return Err(AppError::Validation(
                "Transaction does not exist.".to_string(),
            ));
        }

        Ok(())
    }

    pub async fn list(pool: &SqlitePool) -> Result<Vec<Transaction>, AppError> {
        TransactionRepository::list(pool).await
    }

    pub async fn filter(
        pool: &SqlitePool,
        request: TransactionFilterRequest,
    ) -> Result<Vec<Transaction>, AppError> {
        let account_id = empty_string_to_none(request.account_id);
        if let Some(account_id) = &account_id {
            if AccountRepository::find_by_id(pool, account_id)
                .await?
                .is_none()
            {
                return Err(AppError::Validation("Account does not exist.".to_string()));
            }
        }

        let category_id = empty_string_to_none(request.category_id);
        if let Some(category_id) = &category_id {
            if CategoryRepository::find_by_id(pool, category_id)
                .await?
                .is_none()
            {
                return Err(AppError::Validation("Category does not exist.".to_string()));
            }
        }

        let transaction_type = empty_string_to_none(request.transaction_type)
            .map(|transaction_type| transaction_type.to_lowercase());
        if let Some(transaction_type) = &transaction_type {
            if transaction_type != "income" && transaction_type != "expense" {
                return Err(AppError::Validation(
                    "Transaction type must be income or expense.".to_string(),
                ));
            }
        }

        let start_date = empty_string_to_none(request.start_date);
        let end_date = empty_string_to_none(request.end_date);
        if let (Some(start_date), Some(end_date)) = (&start_date, &end_date) {
            if start_date > end_date {
                return Err(AppError::Validation(
                    "Start date cannot be after end date.".to_string(),
                ));
            }
        }

        let search = empty_string_to_none(request.search);

        TransactionRepository::filter(
            pool,
            account_id,
            category_id,
            transaction_type,
            start_date,
            end_date,
            search,
        )
        .await
    }
}

struct ValidatedTransactionFields {
    account_id: String,
    category_id: String,
    transaction_type: String,
    description: Option<String>,
    transaction_date: String,
}

async fn validate_transaction_fields(
    pool: &SqlitePool,
    account_id: String,
    category_id: String,
    transaction_type: String,
    amount_minor: i64,
    description: Option<String>,
    transaction_date: String,
) -> Result<ValidatedTransactionFields, AppError> {
    let account_id = account_id.trim().to_string();
    if account_id.is_empty() {
        return Err(AppError::Validation("Account is required.".to_string()));
    }

    let category_id = category_id.trim().to_string();
    if category_id.is_empty() {
        return Err(AppError::Validation("Category is required.".to_string()));
    }

    let transaction_type = transaction_type.trim().to_lowercase();
    if transaction_type != "income" && transaction_type != "expense" {
        return Err(AppError::Validation(
            "Transaction type must be income or expense.".to_string(),
        ));
    }

    if amount_minor <= 0 {
        return Err(AppError::Validation(
            "Transaction amount must be greater than 0.".to_string(),
        ));
    }

    let transaction_date = transaction_date.trim().to_string();
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

    Ok(ValidatedTransactionFields {
        account_id,
        category_id,
        transaction_type,
        description: empty_string_to_none(description),
        transaction_date,
    })
}

fn empty_string_to_none(value: Option<String>) -> Option<String> {
    let value = value?.trim().to_string();
    if value.is_empty() {
        None
    } else {
        Some(value)
    }
}
