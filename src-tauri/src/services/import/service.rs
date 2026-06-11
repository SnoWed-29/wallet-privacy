use std::collections::HashSet;

use serde_json::Value;
use sqlx::{Sqlite, SqlitePool, Transaction};

use crate::errors::app_error::AppError;
use crate::services::export::dto::EXPORT_VERSION;

use super::dto::{
    ImportAccount, ImportBudget, ImportCategory, ImportEntityCounts, ImportRecurringBill,
    ImportResult, ImportSavingsGoal, ImportSummary, ImportTransaction, WalletImport,
};

const REQUIRED_TOP_LEVEL_FIELDS: [&str; 8] = [
    "version",
    "exportedAt",
    "accounts",
    "categories",
    "transactions",
    "budgets",
    "recurringBills",
    "savingsGoals",
];

pub struct ImportService;

impl ImportService {
    pub fn validate_json(json: &str) -> Result<WalletImport, AppError> {
        let value: Value = serde_json::from_str(json).map_err(|error| {
            AppError::Validation(format!("Import file is not valid JSON: {error}"))
        })?;

        let object = value.as_object().ok_or_else(|| {
            AppError::Validation("Import file must contain a JSON object.".to_string())
        })?;

        for field in REQUIRED_TOP_LEVEL_FIELDS {
            if !object.contains_key(field) {
                return Err(AppError::Validation(format!(
                    "Import file is missing required property '{field}'."
                )));
            }
        }

        let import: WalletImport = serde_json::from_value(value).map_err(|error| {
            AppError::Validation(format!(
                "Import file has an invalid Wallet export shape: {error}"
            ))
        })?;

        validate_import(&import)?;
        Ok(import)
    }

    pub fn validate_summary(json: &str) -> Result<ImportSummary, AppError> {
        Ok(Self::validate_json(json)?.summary())
    }

    pub async fn import_json(pool: &SqlitePool, json: &str) -> Result<ImportResult, AppError> {
        let import = Self::validate_json(json)?;
        validate_references(pool, &import).await?;

        let mut transaction = pool.begin().await?;
        let imported = insert_missing_records(&mut transaction, &import).await?;
        transaction.commit().await?;

        let summary = import.summary();
        Ok(ImportResult {
            skipped: ImportEntityCounts {
                accounts: summary.accounts as u64 - imported.accounts,
                categories: summary.categories as u64 - imported.categories,
                transactions: summary.transactions as u64 - imported.transactions,
                budgets: summary.budgets as u64 - imported.budgets,
                recurring_bills: summary.recurring_bills as u64 - imported.recurring_bills,
                savings_goals: summary.savings_goals as u64 - imported.savings_goals,
            },
            summary,
            imported,
        })
    }
}

fn validate_import(import: &WalletImport) -> Result<(), AppError> {
    if import.version != EXPORT_VERSION {
        return Err(AppError::Validation(format!(
            "Unsupported import version '{}'. Expected '{}'.",
            import.version, EXPORT_VERSION
        )));
    }

    require_non_empty("exportedAt", &import.exported_at)?;

    let mut account_ids = HashSet::new();
    for account in &import.accounts {
        validate_account(account, &mut account_ids)?;
    }

    let mut category_ids = HashSet::new();
    for category in &import.categories {
        validate_category(category, &mut category_ids)?;
    }

    let mut transaction_ids = HashSet::new();
    for transaction in &import.transactions {
        validate_transaction(transaction, &mut transaction_ids)?;
    }

    let mut budget_ids = HashSet::new();
    for budget in &import.budgets {
        validate_budget(budget, &mut budget_ids)?;
    }

    let mut recurring_bill_ids = HashSet::new();
    for bill in &import.recurring_bills {
        validate_recurring_bill(bill, &mut recurring_bill_ids)?;
    }

    let mut savings_goal_ids = HashSet::new();
    for goal in &import.savings_goals {
        validate_savings_goal(goal, &mut savings_goal_ids)?;
    }

    Ok(())
}

fn validate_account(account: &ImportAccount, ids: &mut HashSet<String>) -> Result<(), AppError> {
    require_unique_id("account", &account.id, ids)?;
    require_non_empty("account.name", &account.name)?;
    require_non_empty("account.accountType", &account.account_type)?;
    require_non_empty("account.currency", &account.currency)?;
    require_non_negative("account.initialBalanceMinor", account.initial_balance_minor)?;
    require_non_empty("account.createdAt", &account.created_at)?;
    require_non_empty("account.updatedAt", &account.updated_at)?;
    Ok(())
}

fn validate_category(category: &ImportCategory, ids: &mut HashSet<String>) -> Result<(), AppError> {
    require_unique_id("category", &category.id, ids)?;
    require_non_empty("category.name", &category.name)?;
    if category.category_type != "income" && category.category_type != "expense" {
        return Err(AppError::Validation(
            "category.categoryType must be income or expense.".to_string(),
        ));
    }
    require_non_empty("category.createdAt", &category.created_at)?;
    require_non_empty("category.updatedAt", &category.updated_at)?;
    Ok(())
}

fn validate_transaction(
    transaction: &ImportTransaction,
    ids: &mut HashSet<String>,
) -> Result<(), AppError> {
    require_unique_id("transaction", &transaction.id, ids)?;
    require_non_empty("transaction.accountId", &transaction.account_id)?;
    require_non_empty("transaction.categoryId", &transaction.category_id)?;
    if transaction.transaction_type != "income" && transaction.transaction_type != "expense" {
        return Err(AppError::Validation(
            "transaction.transactionType must be income or expense.".to_string(),
        ));
    }
    require_positive("transaction.amountMinor", transaction.amount_minor)?;
    require_non_empty("transaction.transactionDate", &transaction.transaction_date)?;
    require_non_empty("transaction.createdAt", &transaction.created_at)?;
    require_non_empty("transaction.updatedAt", &transaction.updated_at)?;
    Ok(())
}

fn validate_budget(budget: &ImportBudget, ids: &mut HashSet<String>) -> Result<(), AppError> {
    require_unique_id("budget", &budget.id, ids)?;
    require_non_empty("budget.name", &budget.name)?;
    require_non_empty("budget.categoryId", &budget.category_id)?;
    require_positive("budget.amountMinor", budget.amount_minor)?;
    if !(1..=12).contains(&budget.month) {
        return Err(AppError::Validation(
            "budget.month must be between 1 and 12.".to_string(),
        ));
    }
    if budget.year < 1970 {
        return Err(AppError::Validation(
            "budget.year must be 1970 or later.".to_string(),
        ));
    }
    require_non_empty("budget.createdAt", &budget.created_at)?;
    require_non_empty("budget.updatedAt", &budget.updated_at)?;
    Ok(())
}

fn validate_recurring_bill(
    bill: &ImportRecurringBill,
    ids: &mut HashSet<String>,
) -> Result<(), AppError> {
    require_unique_id("recurringBill", &bill.id, ids)?;
    require_non_empty("recurringBill.name", &bill.name)?;
    require_non_empty("recurringBill.accountId", &bill.account_id)?;
    require_non_empty("recurringBill.categoryId", &bill.category_id)?;
    require_positive("recurringBill.amountMinor", bill.amount_minor)?;
    if !matches!(
        bill.frequency.as_str(),
        "weekly" | "monthly" | "quarterly" | "yearly"
    ) {
        return Err(AppError::Validation(
            "recurringBill.frequency must be weekly, monthly, quarterly, or yearly.".to_string(),
        ));
    }
    require_non_empty("recurringBill.nextDueDate", &bill.next_due_date)?;
    require_non_empty("recurringBill.createdAt", &bill.created_at)?;
    require_non_empty("recurringBill.updatedAt", &bill.updated_at)?;
    Ok(())
}

fn validate_savings_goal(
    goal: &ImportSavingsGoal,
    ids: &mut HashSet<String>,
) -> Result<(), AppError> {
    require_unique_id("savingsGoal", &goal.id, ids)?;
    require_non_empty("savingsGoal.name", &goal.name)?;
    require_positive("savingsGoal.targetAmountMinor", goal.target_amount_minor)?;
    require_non_negative("savingsGoal.currentAmountMinor", goal.current_amount_minor)?;
    if goal.current_amount_minor > goal.target_amount_minor {
        return Err(AppError::Validation(
            "savingsGoal.currentAmountMinor cannot exceed targetAmountMinor.".to_string(),
        ));
    }
    require_non_empty("savingsGoal.createdAt", &goal.created_at)?;
    require_non_empty("savingsGoal.updatedAt", &goal.updated_at)?;
    Ok(())
}

async fn validate_references(pool: &SqlitePool, import: &WalletImport) -> Result<(), AppError> {
    let account_ids: HashSet<&str> = import
        .accounts
        .iter()
        .map(|account| account.id.as_str())
        .collect();
    let category_ids: HashSet<&str> = import
        .categories
        .iter()
        .map(|category| category.id.as_str())
        .collect();

    for transaction in &import.transactions {
        ensure_account_reference(pool, &account_ids, &transaction.account_id, "transaction")
            .await?;
        ensure_category_reference(pool, &category_ids, &transaction.category_id, "transaction")
            .await?;
    }

    for budget in &import.budgets {
        ensure_category_reference(pool, &category_ids, &budget.category_id, "budget").await?;
    }

    for bill in &import.recurring_bills {
        ensure_account_reference(pool, &account_ids, &bill.account_id, "recurring bill").await?;
        ensure_category_reference(pool, &category_ids, &bill.category_id, "recurring bill").await?;
    }

    Ok(())
}

async fn ensure_account_reference(
    pool: &SqlitePool,
    imported_ids: &HashSet<&str>,
    id: &str,
    entity: &str,
) -> Result<(), AppError> {
    if imported_ids.contains(id) || account_exists(pool, id).await? {
        return Ok(());
    }

    Err(AppError::Validation(format!(
        "Import {entity} references missing account '{id}'."
    )))
}

async fn ensure_category_reference(
    pool: &SqlitePool,
    imported_ids: &HashSet<&str>,
    id: &str,
    entity: &str,
) -> Result<(), AppError> {
    if imported_ids.contains(id) || category_exists(pool, id).await? {
        return Ok(());
    }

    Err(AppError::Validation(format!(
        "Import {entity} references missing category '{id}'."
    )))
}

async fn insert_missing_records(
    transaction: &mut Transaction<'_, Sqlite>,
    import: &WalletImport,
) -> Result<ImportEntityCounts, AppError> {
    let mut counts = ImportEntityCounts::default();

    for account in &import.accounts {
        counts.accounts += insert_account(transaction, account).await?;
    }
    for category in &import.categories {
        counts.categories += insert_category(transaction, category).await?;
    }
    for transaction_item in &import.transactions {
        counts.transactions += insert_transaction(transaction, transaction_item).await?;
    }
    for budget in &import.budgets {
        counts.budgets += insert_budget(transaction, budget).await?;
    }
    for bill in &import.recurring_bills {
        counts.recurring_bills += insert_recurring_bill(transaction, bill).await?;
    }
    for goal in &import.savings_goals {
        counts.savings_goals += insert_savings_goal(transaction, goal).await?;
    }

    Ok(counts)
}

async fn insert_account(
    transaction: &mut Transaction<'_, Sqlite>,
    account: &ImportAccount,
) -> Result<u64, AppError> {
    let result = sqlx::query(
        r#"
        INSERT OR IGNORE INTO accounts (
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
    .execute(&mut **transaction)
    .await?;

    Ok(result.rows_affected())
}

async fn insert_category(
    transaction: &mut Transaction<'_, Sqlite>,
    category: &ImportCategory,
) -> Result<u64, AppError> {
    let result = sqlx::query(
        r#"
        INSERT OR IGNORE INTO categories (
            id,
            name,
            category_type,
            icon,
            color,
            is_archived,
            created_at,
            updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(&category.id)
    .bind(&category.name)
    .bind(&category.category_type)
    .bind(&category.icon)
    .bind(&category.color)
    .bind(category.is_archived)
    .bind(&category.created_at)
    .bind(&category.updated_at)
    .execute(&mut **transaction)
    .await?;

    Ok(result.rows_affected())
}

async fn insert_transaction(
    transaction: &mut Transaction<'_, Sqlite>,
    transaction_item: &ImportTransaction,
) -> Result<u64, AppError> {
    let result = sqlx::query(
        r#"
        INSERT OR IGNORE INTO transactions (
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
    .bind(&transaction_item.id)
    .bind(&transaction_item.account_id)
    .bind(&transaction_item.category_id)
    .bind(&transaction_item.transaction_type)
    .bind(transaction_item.amount_minor)
    .bind(&transaction_item.description)
    .bind(&transaction_item.transaction_date)
    .bind(&transaction_item.created_at)
    .bind(&transaction_item.updated_at)
    .execute(&mut **transaction)
    .await?;

    Ok(result.rows_affected())
}

async fn insert_budget(
    transaction: &mut Transaction<'_, Sqlite>,
    budget: &ImportBudget,
) -> Result<u64, AppError> {
    let result = sqlx::query(
        r#"
        INSERT OR IGNORE INTO budgets (
            id,
            name,
            category_id,
            amount_minor,
            month,
            year,
            is_archived,
            created_at,
            updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(&budget.id)
    .bind(&budget.name)
    .bind(&budget.category_id)
    .bind(budget.amount_minor)
    .bind(budget.month)
    .bind(budget.year)
    .bind(budget.is_archived)
    .bind(&budget.created_at)
    .bind(&budget.updated_at)
    .execute(&mut **transaction)
    .await?;

    Ok(result.rows_affected())
}

async fn insert_recurring_bill(
    transaction: &mut Transaction<'_, Sqlite>,
    bill: &ImportRecurringBill,
) -> Result<u64, AppError> {
    let result = sqlx::query(
        r#"
        INSERT OR IGNORE INTO recurring_bills (
            id,
            name,
            account_id,
            category_id,
            amount_minor,
            frequency,
            next_due_date,
            last_paid_date,
            description,
            is_archived,
            created_at,
            updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(&bill.id)
    .bind(&bill.name)
    .bind(&bill.account_id)
    .bind(&bill.category_id)
    .bind(bill.amount_minor)
    .bind(&bill.frequency)
    .bind(&bill.next_due_date)
    .bind(&bill.last_paid_date)
    .bind(&bill.description)
    .bind(bill.is_archived)
    .bind(&bill.created_at)
    .bind(&bill.updated_at)
    .execute(&mut **transaction)
    .await?;

    Ok(result.rows_affected())
}

async fn insert_savings_goal(
    transaction: &mut Transaction<'_, Sqlite>,
    goal: &ImportSavingsGoal,
) -> Result<u64, AppError> {
    let result = sqlx::query(
        r#"
        INSERT OR IGNORE INTO savings_goals (
            id,
            name,
            target_amount_minor,
            current_amount_minor,
            deadline_date,
            is_archived,
            created_at,
            updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(&goal.id)
    .bind(&goal.name)
    .bind(goal.target_amount_minor)
    .bind(goal.current_amount_minor)
    .bind(&goal.deadline_date)
    .bind(goal.is_archived)
    .bind(&goal.created_at)
    .bind(&goal.updated_at)
    .execute(&mut **transaction)
    .await?;

    Ok(result.rows_affected())
}

async fn account_exists(pool: &SqlitePool, id: &str) -> Result<bool, AppError> {
    let exists: i64 = sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM accounts WHERE id = ?)")
        .bind(id)
        .fetch_one(pool)
        .await?;
    Ok(exists == 1)
}

async fn category_exists(pool: &SqlitePool, id: &str) -> Result<bool, AppError> {
    let exists: i64 = sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM categories WHERE id = ?)")
        .bind(id)
        .fetch_one(pool)
        .await?;
    Ok(exists == 1)
}

fn require_unique_id(entity: &str, id: &str, ids: &mut HashSet<String>) -> Result<(), AppError> {
    require_non_empty(&format!("{entity}.id"), id)?;
    if !ids.insert(id.to_string()) {
        return Err(AppError::Validation(format!(
            "Import file contains duplicate {entity} id '{id}'."
        )));
    }
    Ok(())
}

fn require_non_empty(field: &str, value: &str) -> Result<(), AppError> {
    if value.trim().is_empty() {
        return Err(AppError::Validation(format!("{field} is required.")));
    }
    Ok(())
}

fn require_positive(field: &str, value: i64) -> Result<(), AppError> {
    if value <= 0 {
        return Err(AppError::Validation(format!(
            "{field} must be greater than 0."
        )));
    }
    Ok(())
}

fn require_non_negative(field: &str, value: i64) -> Result<(), AppError> {
    if value < 0 {
        return Err(AppError::Validation(format!("{field} cannot be negative.")));
    }
    Ok(())
}
