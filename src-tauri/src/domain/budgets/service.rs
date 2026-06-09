use sqlx::SqlitePool;

use crate::domain::budgets::dto::{ArchiveBudgetRequest, CreateBudgetRequest, UpdateBudgetRequest};
use crate::domain::budgets::model::Budget;
use crate::errors::app_error::AppError;
use crate::repositories::budget_repository::BudgetRepository;
use crate::repositories::category_repository::CategoryRepository;

pub struct BudgetService;

impl BudgetService {
    pub async fn create(
        pool: &SqlitePool,
        request: CreateBudgetRequest,
    ) -> Result<Budget, AppError> {
        let validated = validate_budget_fields(
            pool,
            request.name,
            request.category_id,
            request.amount_minor,
            request.month,
            request.year,
        )
        .await?;

        BudgetRepository::create(
            pool,
            validated.name,
            validated.category_id,
            request.amount_minor,
            request.month,
            request.year,
        )
        .await
    }

    pub async fn list(pool: &SqlitePool) -> Result<Vec<Budget>, AppError> {
        BudgetRepository::list(pool).await
    }

    pub async fn update(
        pool: &SqlitePool,
        request: UpdateBudgetRequest,
    ) -> Result<Budget, AppError> {
        let id = request.id.trim().to_string();
        if id.is_empty() {
            return Err(AppError::Validation("Budget id is required.".to_string()));
        }

        if BudgetRepository::find_by_id(pool, &id).await?.is_none() {
            return Err(AppError::Validation("Budget does not exist.".to_string()));
        }

        let validated = validate_budget_fields(
            pool,
            request.name,
            request.category_id,
            request.amount_minor,
            request.month,
            request.year,
        )
        .await?;

        BudgetRepository::update(
            pool,
            id,
            validated.name,
            validated.category_id,
            request.amount_minor,
            request.month,
            request.year,
        )
        .await
    }

    pub async fn archive(pool: &SqlitePool, request: ArchiveBudgetRequest) -> Result<(), AppError> {
        let id = request.id.trim().to_string();
        if id.is_empty() {
            return Err(AppError::Validation("Budget id is required.".to_string()));
        }

        let archived_count = BudgetRepository::archive(pool, &id).await?;
        if archived_count == 0 {
            return Err(AppError::Validation("Budget does not exist.".to_string()));
        }

        Ok(())
    }
}

struct ValidatedBudgetFields {
    name: String,
    category_id: String,
}

async fn validate_budget_fields(
    pool: &SqlitePool,
    name: String,
    category_id: String,
    amount_minor: i64,
    month: i64,
    year: i64,
) -> Result<ValidatedBudgetFields, AppError> {
    let name = name.trim().to_string();
    if name.is_empty() {
        return Err(AppError::Validation("Budget name is required.".to_string()));
    }

    let category_id = category_id.trim().to_string();
    if category_id.is_empty() {
        return Err(AppError::Validation("Category is required.".to_string()));
    }

    if amount_minor <= 0 {
        return Err(AppError::Validation(
            "Budget amount must be greater than 0.".to_string(),
        ));
    }

    if !(1..=12).contains(&month) {
        return Err(AppError::Validation(
            "Budget month must be between 1 and 12.".to_string(),
        ));
    }

    if !(1..=9999).contains(&year) {
        return Err(AppError::Validation(
            "Budget year must be valid.".to_string(),
        ));
    }

    let category = CategoryRepository::find_by_id(pool, &category_id)
        .await?
        .ok_or_else(|| AppError::Validation("Category does not exist.".to_string()))?;
    if category.category_type != "expense" {
        return Err(AppError::Validation(
            "Budgets can only use expense categories.".to_string(),
        ));
    }
    if category.is_archived {
        return Err(AppError::Validation(
            "Archived categories cannot be used for new budgets.".to_string(),
        ));
    }

    Ok(ValidatedBudgetFields { name, category_id })
}
