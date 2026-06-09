use chrono::Utc;
use sqlx::SqlitePool;

use crate::domain::savings_goals::dto::{
    ArchiveSavingsGoalRequest, ContributeToSavingsGoalRequest, CreateSavingsGoalRequest,
    UpdateSavingsGoalRequest,
};
use crate::domain::savings_goals::model::SavingsGoal;
use crate::errors::app_error::AppError;
use crate::repositories::account_repository::AccountRepository;
use crate::repositories::savings_goal_repository::SavingsGoalRepository;

pub struct SavingsGoalService;

impl SavingsGoalService {
    pub async fn create(
        pool: &SqlitePool,
        request: CreateSavingsGoalRequest,
    ) -> Result<SavingsGoal, AppError> {
        let validated = validate_savings_goal_fields(
            request.name,
            request.target_amount_minor,
            request.current_amount_minor.unwrap_or(0),
            request.deadline_date,
        )?;

        SavingsGoalRepository::create(
            pool,
            validated.name,
            request.target_amount_minor,
            validated.current_amount_minor,
            validated.deadline_date,
        )
        .await
    }

    pub async fn list(pool: &SqlitePool) -> Result<Vec<SavingsGoal>, AppError> {
        SavingsGoalRepository::list(pool).await
    }

    pub async fn update(
        pool: &SqlitePool,
        request: UpdateSavingsGoalRequest,
    ) -> Result<SavingsGoal, AppError> {
        let id = request.id.trim().to_string();
        if id.is_empty() {
            return Err(AppError::Validation(
                "Savings goal id is required.".to_string(),
            ));
        }

        if SavingsGoalRepository::find_by_id(pool, &id)
            .await?
            .is_none()
        {
            return Err(AppError::Validation(
                "Savings goal does not exist.".to_string(),
            ));
        }

        let validated = validate_savings_goal_fields(
            request.name,
            request.target_amount_minor,
            request.current_amount_minor,
            request.deadline_date,
        )?;

        SavingsGoalRepository::update(
            pool,
            id,
            validated.name,
            request.target_amount_minor,
            validated.current_amount_minor,
            validated.deadline_date,
        )
        .await
    }

    pub async fn archive(
        pool: &SqlitePool,
        request: ArchiveSavingsGoalRequest,
    ) -> Result<(), AppError> {
        let id = request.id.trim().to_string();
        if id.is_empty() {
            return Err(AppError::Validation(
                "Savings goal id is required.".to_string(),
            ));
        }

        let archived_count = SavingsGoalRepository::archive(pool, &id).await?;
        if archived_count == 0 {
            return Err(AppError::Validation(
                "Savings goal does not exist.".to_string(),
            ));
        }

        Ok(())
    }

    pub async fn contribute(
        pool: &SqlitePool,
        request: ContributeToSavingsGoalRequest,
    ) -> Result<SavingsGoal, AppError> {
        let savings_goal_id = request.savings_goal_id.trim().to_string();
        if savings_goal_id.is_empty() {
            return Err(AppError::Validation(
                "Savings goal is required.".to_string(),
            ));
        }

        let goal = SavingsGoalRepository::find_by_id(pool, &savings_goal_id)
            .await?
            .ok_or_else(|| AppError::Validation("Savings goal does not exist.".to_string()))?;
        if goal.is_archived {
            return Err(AppError::Validation(
                "Archived savings goals cannot receive contributions.".to_string(),
            ));
        }

        let account_id = request.account_id.trim().to_string();
        if account_id.is_empty() {
            return Err(AppError::Validation("Account is required.".to_string()));
        }

        let account = AccountRepository::find_by_id(pool, &account_id)
            .await?
            .ok_or_else(|| AppError::Validation("Account does not exist.".to_string()))?;
        if account.is_archived {
            return Err(AppError::Validation(
                "Archived accounts cannot be used for savings goal contributions.".to_string(),
            ));
        }

        if request.amount_minor <= 0 {
            return Err(AppError::Validation(
                "Contribution amount must be greater than 0.".to_string(),
            ));
        }

        if goal.current_amount_minor + request.amount_minor > goal.target_amount_minor {
            return Err(AppError::Validation(
                "Contribution cannot exceed the savings goal target.".to_string(),
            ));
        }

        let transaction_date = request
            .transaction_date
            .map(|transaction_date| transaction_date.trim().to_string())
            .filter(|transaction_date| !transaction_date.is_empty())
            .unwrap_or_else(|| Utc::now().date_naive().to_string());

        let description = request
            .description
            .map(|description| description.trim().to_string())
            .filter(|description| !description.is_empty())
            .unwrap_or_else(|| format!("Contribution to {}", goal.name));

        SavingsGoalRepository::contribute(
            pool,
            &savings_goal_id,
            &account_id,
            &goal.name,
            request.amount_minor,
            transaction_date,
            description,
        )
        .await
    }
}

struct ValidatedSavingsGoalFields {
    name: String,
    current_amount_minor: i64,
    deadline_date: Option<String>,
}

fn validate_savings_goal_fields(
    name: String,
    target_amount_minor: i64,
    current_amount_minor: i64,
    deadline_date: Option<String>,
) -> Result<ValidatedSavingsGoalFields, AppError> {
    let name = name.trim().to_string();
    if name.is_empty() {
        return Err(AppError::Validation(
            "Savings goal name is required.".to_string(),
        ));
    }

    if target_amount_minor <= 0 {
        return Err(AppError::Validation(
            "Savings goal target amount must be greater than 0.".to_string(),
        ));
    }

    if current_amount_minor < 0 {
        return Err(AppError::Validation(
            "Savings goal current amount cannot be negative.".to_string(),
        ));
    }

    if current_amount_minor > target_amount_minor {
        return Err(AppError::Validation(
            "Savings goal current amount cannot exceed target amount.".to_string(),
        ));
    }

    let deadline_date = deadline_date
        .map(|deadline_date| deadline_date.trim().to_string())
        .filter(|deadline_date| !deadline_date.is_empty());

    Ok(ValidatedSavingsGoalFields {
        name,
        current_amount_minor,
        deadline_date,
    })
}
