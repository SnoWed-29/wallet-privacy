use chrono::{Days, Months, NaiveDate, Utc};
use sqlx::SqlitePool;

use crate::domain::recurring_bills::dto::{
    ArchiveRecurringBillRequest, CreateRecurringBillRequest, MarkRecurringBillPaidRequest,
    UpdateRecurringBillRequest,
};
use crate::domain::recurring_bills::model::RecurringBill;
use crate::errors::app_error::AppError;
use crate::repositories::account_repository::AccountRepository;
use crate::repositories::category_repository::CategoryRepository;
use crate::repositories::recurring_bill_repository::RecurringBillRepository;

pub struct RecurringBillService;

impl RecurringBillService {
    pub async fn create(
        pool: &SqlitePool,
        request: CreateRecurringBillRequest,
    ) -> Result<RecurringBill, AppError> {
        let validated = validate_recurring_bill_fields(
            pool,
            request.name,
            request.account_id,
            request.category_id,
            request.amount_minor,
            request.frequency,
            request.next_due_date,
            request.description,
        )
        .await?;

        RecurringBillRepository::create(
            pool,
            validated.name,
            validated.account_id,
            validated.category_id,
            request.amount_minor,
            validated.frequency,
            validated.next_due_date,
            validated.description,
        )
        .await
    }

    pub async fn list(pool: &SqlitePool) -> Result<Vec<RecurringBill>, AppError> {
        RecurringBillRepository::list(pool).await
    }

    pub async fn update(
        pool: &SqlitePool,
        request: UpdateRecurringBillRequest,
    ) -> Result<RecurringBill, AppError> {
        let id = request.id.trim().to_string();
        if id.is_empty() {
            return Err(AppError::Validation(
                "Recurring bill id is required.".to_string(),
            ));
        }

        if RecurringBillRepository::find_by_id(pool, &id)
            .await?
            .is_none()
        {
            return Err(AppError::Validation(
                "Recurring bill does not exist.".to_string(),
            ));
        }

        let validated = validate_recurring_bill_fields(
            pool,
            request.name,
            request.account_id,
            request.category_id,
            request.amount_minor,
            request.frequency,
            request.next_due_date,
            request.description,
        )
        .await?;

        RecurringBillRepository::update(
            pool,
            id,
            validated.name,
            validated.account_id,
            validated.category_id,
            request.amount_minor,
            validated.frequency,
            validated.next_due_date,
            validated.description,
        )
        .await
    }

    pub async fn archive(
        pool: &SqlitePool,
        request: ArchiveRecurringBillRequest,
    ) -> Result<(), AppError> {
        let id = request.id.trim().to_string();
        if id.is_empty() {
            return Err(AppError::Validation(
                "Recurring bill id is required.".to_string(),
            ));
        }

        let archived_count = RecurringBillRepository::archive(pool, &id).await?;
        if archived_count == 0 {
            return Err(AppError::Validation(
                "Recurring bill does not exist.".to_string(),
            ));
        }

        Ok(())
    }

    pub async fn mark_paid(
        pool: &SqlitePool,
        request: MarkRecurringBillPaidRequest,
    ) -> Result<RecurringBill, AppError> {
        let id = request.id.trim().to_string();
        if id.is_empty() {
            return Err(AppError::Validation(
                "Recurring bill id is required.".to_string(),
            ));
        }

        let bill = RecurringBillRepository::find_by_id(pool, &id)
            .await?
            .ok_or_else(|| AppError::Validation("Recurring bill does not exist.".to_string()))?;
        if bill.is_archived {
            return Err(AppError::Validation(
                "Archived recurring bills cannot be marked as paid.".to_string(),
            ));
        }

        validate_account(pool, &bill.account_id).await?;
        validate_expense_category(pool, &bill.category_id).await?;

        let paid_date = request
            .paid_date
            .map(|paid_date| paid_date.trim().to_string())
            .filter(|paid_date| !paid_date.is_empty())
            .unwrap_or_else(|| Utc::now().date_naive().to_string());
        let paid_date_value = parse_date(&paid_date, "Paid date")?;
        let next_due_date = next_due_date_after_payment(paid_date_value, &bill.frequency)?;
        let description = bill
            .description
            .clone()
            .unwrap_or_else(|| format!("Payment for {}", bill.name));

        RecurringBillRepository::mark_paid(
            pool,
            &id,
            &bill.account_id,
            &bill.category_id,
            bill.amount_minor,
            paid_date,
            next_due_date,
            description,
        )
        .await
    }
}

struct ValidatedRecurringBillFields {
    name: String,
    account_id: String,
    category_id: String,
    frequency: String,
    next_due_date: String,
    description: Option<String>,
}

async fn validate_recurring_bill_fields(
    pool: &SqlitePool,
    name: String,
    account_id: String,
    category_id: String,
    amount_minor: i64,
    frequency: String,
    next_due_date: String,
    description: Option<String>,
) -> Result<ValidatedRecurringBillFields, AppError> {
    let name = name.trim().to_string();
    if name.is_empty() {
        return Err(AppError::Validation(
            "Recurring bill name is required.".to_string(),
        ));
    }

    let account_id = account_id.trim().to_string();
    if account_id.is_empty() {
        return Err(AppError::Validation("Account is required.".to_string()));
    }
    validate_account(pool, &account_id).await?;

    let category_id = category_id.trim().to_string();
    if category_id.is_empty() {
        return Err(AppError::Validation("Category is required.".to_string()));
    }
    validate_expense_category(pool, &category_id).await?;

    if amount_minor <= 0 {
        return Err(AppError::Validation(
            "Recurring bill amount must be greater than 0.".to_string(),
        ));
    }

    let frequency = frequency.trim().to_lowercase();
    if !matches!(
        frequency.as_str(),
        "daily" | "weekly" | "monthly" | "yearly"
    ) {
        return Err(AppError::Validation(
            "Recurring bill frequency must be daily, weekly, monthly, or yearly.".to_string(),
        ));
    }

    let next_due_date = next_due_date.trim().to_string();
    if next_due_date.is_empty() {
        return Err(AppError::Validation(
            "Next due date is required.".to_string(),
        ));
    }
    parse_date(&next_due_date, "Next due date")?;

    Ok(ValidatedRecurringBillFields {
        name,
        account_id,
        category_id,
        frequency,
        next_due_date,
        description: empty_string_to_none(description),
    })
}

async fn validate_account(pool: &SqlitePool, account_id: &str) -> Result<(), AppError> {
    let account = AccountRepository::find_by_id(pool, account_id)
        .await?
        .ok_or_else(|| AppError::Validation("Account does not exist.".to_string()))?;
    if account.is_archived {
        return Err(AppError::Validation(
            "Archived accounts cannot be used for recurring bills.".to_string(),
        ));
    }

    Ok(())
}

async fn validate_expense_category(pool: &SqlitePool, category_id: &str) -> Result<(), AppError> {
    let category = CategoryRepository::find_by_id(pool, category_id)
        .await?
        .ok_or_else(|| AppError::Validation("Category does not exist.".to_string()))?;
    if category.is_archived {
        return Err(AppError::Validation(
            "Archived categories cannot be used for recurring bills.".to_string(),
        ));
    }
    if category.category_type != "expense" {
        return Err(AppError::Validation(
            "Recurring bills can only use expense categories.".to_string(),
        ));
    }

    Ok(())
}

fn next_due_date_after_payment(paid_date: NaiveDate, frequency: &str) -> Result<String, AppError> {
    let next_due_date = match frequency {
        "daily" => paid_date.checked_add_days(Days::new(1)),
        "weekly" => paid_date.checked_add_days(Days::new(7)),
        "monthly" => paid_date.checked_add_months(Months::new(1)),
        "yearly" => paid_date.checked_add_months(Months::new(12)),
        _ => None,
    }
    .ok_or_else(|| AppError::Validation("Could not calculate next due date.".to_string()))?;

    Ok(next_due_date.to_string())
}

fn parse_date(value: &str, label: &str) -> Result<NaiveDate, AppError> {
    NaiveDate::parse_from_str(value, "%Y-%m-%d")
        .map_err(|_| AppError::Validation(format!("{label} must use YYYY-MM-DD format.")))
}

fn empty_string_to_none(value: Option<String>) -> Option<String> {
    let value = value?.trim().to_string();
    if value.is_empty() {
        None
    } else {
        Some(value)
    }
}
