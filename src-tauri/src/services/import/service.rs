use std::collections::{HashMap, HashSet};

use serde_json::Value;
use sqlx::{Sqlite, SqlitePool, Transaction};

use crate::errors::app_error::AppError;
use crate::services::export::dto::EXPORT_VERSION;

use super::dto::{
    ImportAccount, ImportBudget, ImportCategory, ImportEntityCounts, ImportMode, ImportPreview,
    ImportRecurringBill, ImportResult, ImportSavingsGoal, ImportTransaction, WalletImport,
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

    pub async fn preview(pool: &SqlitePool, json: &str) -> Result<ImportPreview, AppError> {
        let import = Self::validate_json(json)?;
        validate_references(pool, &import, ImportMode::Merge).await?;
        build_preview(pool, &import).await
    }

    pub async fn import_json(
        pool: &SqlitePool,
        json: &str,
        mode: ImportMode,
    ) -> Result<ImportResult, AppError> {
        let import = Self::validate_json(json)?;
        validate_references(pool, &import, mode).await?;
        let preview = build_preview(pool, &import).await?;
        let mut transaction = pool.begin().await?;

        let imported = match mode {
            ImportMode::Merge => merge_import(&mut transaction, &import).await?,
            ImportMode::Replace => {
                clear_finance_data(&mut transaction).await?;
                replace_import(&mut transaction, &import).await?
            }
        };

        transaction.commit().await?;

        let summary = import.summary();
        Ok(ImportResult {
            mode: match mode {
                ImportMode::Merge => "merge".to_string(),
                ImportMode::Replace => "replace".to_string(),
            },
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
            duplicates: preview.duplicates,
            conflicts: preview.conflicts,
            warnings: preview.warnings,
        })
    }
}

async fn build_preview(
    pool: &SqlitePool,
    import: &WalletImport,
) -> Result<ImportPreview, AppError> {
    let mut duplicates = ImportEntityCounts::default();
    let mut conflicts = ImportEntityCounts::default();
    let mut warnings = Vec::new();
    let mut category_map = HashMap::new();

    for account in &import.accounts {
        if account_id_exists(pool, &account.id).await? {
            duplicates.accounts += 1;
        } else if account_name_exists(pool, &account.name).await? {
            conflicts.accounts += 1;
            warnings.push(format!(
                "Account '{}' already exists and will be imported with an '(Imported)' suffix in merge mode.",
                account.name
            ));
        }
    }

    for category in &import.categories {
        if category_id_exists(pool, &category.id).await? {
            duplicates.categories += 1;
            category_map.insert(category.id.clone(), category.id.clone());
        } else if let Some(existing_id) =
            category_id_by_name_type(pool, &category.name, &category.category_type).await?
        {
            duplicates.categories += 1;
            category_map.insert(category.id.clone(), existing_id);
        } else if category_name_exists(pool, &category.name).await? {
            conflicts.categories += 1;
            warnings.push(format!(
                "Category '{}' exists with another type and will be skipped in merge mode.",
                category.name
            ));
        }
    }

    for transaction in &import.transactions {
        let category_id = category_map
            .get(&transaction.category_id)
            .map(String::as_str)
            .unwrap_or(&transaction.category_id);
        if transaction_id_exists(pool, &transaction.id).await?
            || duplicate_transaction_exists(pool, transaction, category_id).await?
        {
            duplicates.transactions += 1;
        }
    }

    for budget in &import.budgets {
        let category_id = category_map
            .get(&budget.category_id)
            .map(String::as_str)
            .unwrap_or(&budget.category_id);
        if budget_id_exists(pool, &budget.id).await?
            || duplicate_budget_exists(pool, category_id, budget.month, budget.year).await?
        {
            duplicates.budgets += 1;
        }
    }

    for bill in &import.recurring_bills {
        if recurring_bill_id_exists(pool, &bill.id).await?
            || duplicate_recurring_bill_exists(pool, bill).await?
        {
            duplicates.recurring_bills += 1;
        }
    }

    for goal in &import.savings_goals {
        if savings_goal_id_exists(pool, &goal.id).await? {
            duplicates.savings_goals += 1;
        } else if savings_goal_name_exists(pool, &goal.name).await? {
            conflicts.savings_goals += 1;
            warnings.push(format!(
                "Savings goal '{}' already exists and will be imported with an '(Imported)' suffix in merge mode.",
                goal.name
            ));
        }
    }

    if import.accounts.is_empty()
        && import.categories.is_empty()
        && import.transactions.is_empty()
        && import.budgets.is_empty()
        && import.recurring_bills.is_empty()
        && import.savings_goals.is_empty()
    {
        warnings.push("The selected export contains no wallet records.".to_string());
    }

    Ok(ImportPreview {
        summary: import.summary(),
        duplicates,
        conflicts,
        warnings,
    })
}

fn validate_import(import: &WalletImport) -> Result<(), AppError> {
    if import.version != EXPORT_VERSION {
        return Err(AppError::Validation(format!(
            "Unsupported import version '{}'. Expected '{}'.",
            import.version, EXPORT_VERSION
        )));
    }

    require_non_empty("exportedAt", &import.exported_at)?;

    validate_unique_entities(
        "account",
        import.accounts.iter().map(|item| item.id.as_str()),
    )?;
    validate_unique_entities(
        "category",
        import.categories.iter().map(|item| item.id.as_str()),
    )?;
    validate_unique_entities(
        "transaction",
        import.transactions.iter().map(|item| item.id.as_str()),
    )?;
    validate_unique_entities("budget", import.budgets.iter().map(|item| item.id.as_str()))?;
    validate_unique_entities(
        "recurringBill",
        import.recurring_bills.iter().map(|item| item.id.as_str()),
    )?;
    validate_unique_entities(
        "savingsGoal",
        import.savings_goals.iter().map(|item| item.id.as_str()),
    )?;

    for account in &import.accounts {
        require_non_empty("account.name", &account.name)?;
        require_non_empty("account.accountType", &account.account_type)?;
        require_non_empty("account.currency", &account.currency)?;
        require_non_negative("account.initialBalanceMinor", account.initial_balance_minor)?;
        require_non_empty("account.createdAt", &account.created_at)?;
        require_non_empty("account.updatedAt", &account.updated_at)?;
    }

    for category in &import.categories {
        require_non_empty("category.name", &category.name)?;
        if category.category_type != "income" && category.category_type != "expense" {
            return Err(AppError::Validation(
                "category.categoryType must be income or expense.".to_string(),
            ));
        }
        require_non_empty("category.createdAt", &category.created_at)?;
        require_non_empty("category.updatedAt", &category.updated_at)?;
    }

    for transaction in &import.transactions {
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
    }

    for budget in &import.budgets {
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
    }

    for bill in &import.recurring_bills {
        require_non_empty("recurringBill.name", &bill.name)?;
        require_non_empty("recurringBill.accountId", &bill.account_id)?;
        require_non_empty("recurringBill.categoryId", &bill.category_id)?;
        require_positive("recurringBill.amountMinor", bill.amount_minor)?;
        if !matches!(
            bill.frequency.as_str(),
            "weekly" | "monthly" | "quarterly" | "yearly"
        ) {
            return Err(AppError::Validation(
                "recurringBill.frequency must be weekly, monthly, quarterly, or yearly."
                    .to_string(),
            ));
        }
        require_non_empty("recurringBill.nextDueDate", &bill.next_due_date)?;
        require_non_empty("recurringBill.createdAt", &bill.created_at)?;
        require_non_empty("recurringBill.updatedAt", &bill.updated_at)?;
    }

    for goal in &import.savings_goals {
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
    }

    Ok(())
}

async fn validate_references(
    pool: &SqlitePool,
    import: &WalletImport,
    mode: ImportMode,
) -> Result<(), AppError> {
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
        ensure_account_reference(
            pool,
            &account_ids,
            &transaction.account_id,
            "transaction",
            mode,
        )
        .await?;
        ensure_category_reference(
            pool,
            &category_ids,
            &transaction.category_id,
            "transaction",
            mode,
        )
        .await?;
    }

    for budget in &import.budgets {
        ensure_category_reference(pool, &category_ids, &budget.category_id, "budget", mode).await?;
    }

    for bill in &import.recurring_bills {
        ensure_account_reference(pool, &account_ids, &bill.account_id, "recurring bill", mode)
            .await?;
        ensure_category_reference(
            pool,
            &category_ids,
            &bill.category_id,
            "recurring bill",
            mode,
        )
        .await?;
    }

    Ok(())
}

async fn ensure_account_reference(
    pool: &SqlitePool,
    imported_ids: &HashSet<&str>,
    id: &str,
    entity: &str,
    mode: ImportMode,
) -> Result<(), AppError> {
    if imported_ids.contains(id)
        || (mode == ImportMode::Merge && account_id_exists(pool, id).await?)
    {
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
    mode: ImportMode,
) -> Result<(), AppError> {
    if imported_ids.contains(id)
        || (mode == ImportMode::Merge && category_id_exists(pool, id).await?)
    {
        return Ok(());
    }

    Err(AppError::Validation(format!(
        "Import {entity} references missing category '{id}'."
    )))
}

async fn merge_import(
    transaction: &mut Transaction<'_, Sqlite>,
    import: &WalletImport,
) -> Result<ImportEntityCounts, AppError> {
    let mut counts = ImportEntityCounts::default();
    let mut category_map = HashMap::new();
    let import_category_ids: HashSet<&str> = import
        .categories
        .iter()
        .map(|category| category.id.as_str())
        .collect();

    for account in &import.accounts {
        if account_id_exists_tx(transaction, &account.id).await? {
            continue;
        }
        let name = if account_name_exists_tx(transaction, &account.name).await? {
            unique_account_name(transaction, &account.name).await?
        } else {
            account.name.clone()
        };
        counts.accounts += insert_account(transaction, account, &name).await?;
    }

    for category in &import.categories {
        if category_id_exists_tx(transaction, &category.id).await? {
            category_map.insert(category.id.clone(), category.id.clone());
            continue;
        }
        if let Some(existing_id) =
            category_id_by_name_type_tx(transaction, &category.name, &category.category_type)
                .await?
        {
            category_map.insert(category.id.clone(), existing_id);
            continue;
        }
        if category_name_exists_tx(transaction, &category.name).await? {
            continue;
        }
        counts.categories += insert_category(transaction, category).await?;
        category_map.insert(category.id.clone(), category.id.clone());
    }

    for transaction_item in &import.transactions {
        let Some(category_id) = resolved_category_id(
            &category_map,
            &import_category_ids,
            &transaction_item.category_id,
        ) else {
            continue;
        };
        if transaction_id_exists_tx(transaction, &transaction_item.id).await?
            || duplicate_transaction_exists_tx(transaction, transaction_item, &category_id).await?
        {
            continue;
        }
        counts.transactions +=
            insert_transaction(transaction, transaction_item, &category_id).await?;
    }

    for budget in &import.budgets {
        let Some(category_id) =
            resolved_category_id(&category_map, &import_category_ids, &budget.category_id)
        else {
            continue;
        };
        if budget_id_exists_tx(transaction, &budget.id).await?
            || duplicate_budget_exists_tx(transaction, &category_id, budget.month, budget.year)
                .await?
        {
            continue;
        }
        counts.budgets += insert_budget(transaction, budget, &category_id).await?;
    }

    for bill in &import.recurring_bills {
        let Some(category_id) =
            resolved_category_id(&category_map, &import_category_ids, &bill.category_id)
        else {
            continue;
        };
        if recurring_bill_id_exists_tx(transaction, &bill.id).await?
            || duplicate_recurring_bill_exists_tx(transaction, bill).await?
        {
            continue;
        }
        counts.recurring_bills += insert_recurring_bill(transaction, bill, &category_id).await?;
    }

    for goal in &import.savings_goals {
        if savings_goal_id_exists_tx(transaction, &goal.id).await? {
            continue;
        }
        let name = if savings_goal_name_exists_tx(transaction, &goal.name).await? {
            unique_savings_goal_name(transaction, &goal.name).await?
        } else {
            goal.name.clone()
        };
        counts.savings_goals += insert_savings_goal(transaction, goal, &name).await?;
    }

    Ok(counts)
}

fn resolved_category_id(
    category_map: &HashMap<String, String>,
    import_category_ids: &HashSet<&str>,
    category_id: &str,
) -> Option<String> {
    if let Some(mapped_id) = category_map.get(category_id) {
        return Some(mapped_id.clone());
    }

    if import_category_ids.contains(category_id) {
        return None;
    }

    Some(category_id.to_string())
}

async fn replace_import(
    transaction: &mut Transaction<'_, Sqlite>,
    import: &WalletImport,
) -> Result<ImportEntityCounts, AppError> {
    let mut counts = ImportEntityCounts::default();

    for account in &import.accounts {
        counts.accounts += insert_account(transaction, account, &account.name).await?;
    }
    for category in &import.categories {
        counts.categories += insert_category(transaction, category).await?;
    }
    for transaction_item in &import.transactions {
        counts.transactions +=
            insert_transaction(transaction, transaction_item, &transaction_item.category_id)
                .await?;
    }
    for budget in &import.budgets {
        counts.budgets += insert_budget(transaction, budget, &budget.category_id).await?;
    }
    for bill in &import.recurring_bills {
        counts.recurring_bills +=
            insert_recurring_bill(transaction, bill, &bill.category_id).await?;
    }
    for goal in &import.savings_goals {
        counts.savings_goals += insert_savings_goal(transaction, goal, &goal.name).await?;
    }

    Ok(counts)
}

async fn clear_finance_data(transaction: &mut Transaction<'_, Sqlite>) -> Result<(), AppError> {
    sqlx::query("DELETE FROM recurring_bills")
        .execute(&mut **transaction)
        .await?;
    sqlx::query("DELETE FROM budgets")
        .execute(&mut **transaction)
        .await?;
    sqlx::query("DELETE FROM transactions")
        .execute(&mut **transaction)
        .await?;
    sqlx::query("DELETE FROM savings_goals")
        .execute(&mut **transaction)
        .await?;
    sqlx::query("DELETE FROM categories")
        .execute(&mut **transaction)
        .await?;
    sqlx::query("DELETE FROM accounts")
        .execute(&mut **transaction)
        .await?;
    Ok(())
}

async fn insert_account(
    transaction: &mut Transaction<'_, Sqlite>,
    account: &ImportAccount,
    name: &str,
) -> Result<u64, AppError> {
    Ok(sqlx::query(
        r#"
        INSERT INTO accounts (
            id, name, account_type, currency, initial_balance_minor, is_archived, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(&account.id)
    .bind(name)
    .bind(&account.account_type)
    .bind(&account.currency)
    .bind(account.initial_balance_minor)
    .bind(account.is_archived)
    .bind(&account.created_at)
    .bind(&account.updated_at)
    .execute(&mut **transaction)
    .await?
    .rows_affected())
}

async fn insert_category(
    transaction: &mut Transaction<'_, Sqlite>,
    category: &ImportCategory,
) -> Result<u64, AppError> {
    Ok(sqlx::query(
        r#"
        INSERT INTO categories (
            id, name, category_type, icon, color, is_archived, created_at, updated_at
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
    .await?
    .rows_affected())
}

async fn insert_transaction(
    transaction: &mut Transaction<'_, Sqlite>,
    item: &ImportTransaction,
    category_id: &str,
) -> Result<u64, AppError> {
    Ok(sqlx::query(
        r#"
        INSERT INTO transactions (
            id, account_id, category_id, transaction_type, amount_minor, description, transaction_date, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(&item.id)
    .bind(&item.account_id)
    .bind(category_id)
    .bind(&item.transaction_type)
    .bind(item.amount_minor)
    .bind(&item.description)
    .bind(&item.transaction_date)
    .bind(&item.created_at)
    .bind(&item.updated_at)
    .execute(&mut **transaction)
    .await?
    .rows_affected())
}

async fn insert_budget(
    transaction: &mut Transaction<'_, Sqlite>,
    budget: &ImportBudget,
    category_id: &str,
) -> Result<u64, AppError> {
    Ok(sqlx::query(
        r#"
        INSERT INTO budgets (
            id, name, category_id, amount_minor, month, year, is_archived, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(&budget.id)
    .bind(&budget.name)
    .bind(category_id)
    .bind(budget.amount_minor)
    .bind(budget.month)
    .bind(budget.year)
    .bind(budget.is_archived)
    .bind(&budget.created_at)
    .bind(&budget.updated_at)
    .execute(&mut **transaction)
    .await?
    .rows_affected())
}

async fn insert_recurring_bill(
    transaction: &mut Transaction<'_, Sqlite>,
    bill: &ImportRecurringBill,
    category_id: &str,
) -> Result<u64, AppError> {
    Ok(sqlx::query(
        r#"
        INSERT INTO recurring_bills (
            id, name, account_id, category_id, amount_minor, frequency, next_due_date,
            last_paid_date, description, is_archived, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(&bill.id)
    .bind(&bill.name)
    .bind(&bill.account_id)
    .bind(category_id)
    .bind(bill.amount_minor)
    .bind(&bill.frequency)
    .bind(&bill.next_due_date)
    .bind(&bill.last_paid_date)
    .bind(&bill.description)
    .bind(bill.is_archived)
    .bind(&bill.created_at)
    .bind(&bill.updated_at)
    .execute(&mut **transaction)
    .await?
    .rows_affected())
}

async fn insert_savings_goal(
    transaction: &mut Transaction<'_, Sqlite>,
    goal: &ImportSavingsGoal,
    name: &str,
) -> Result<u64, AppError> {
    Ok(sqlx::query(
        r#"
        INSERT INTO savings_goals (
            id, name, target_amount_minor, current_amount_minor, deadline_date, is_archived, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(&goal.id)
    .bind(name)
    .bind(goal.target_amount_minor)
    .bind(goal.current_amount_minor)
    .bind(&goal.deadline_date)
    .bind(goal.is_archived)
    .bind(&goal.created_at)
    .bind(&goal.updated_at)
    .execute(&mut **transaction)
    .await?
    .rows_affected())
}

async fn unique_account_name(
    transaction: &mut Transaction<'_, Sqlite>,
    name: &str,
) -> Result<String, AppError> {
    unique_name(transaction, name, NameTable::Accounts).await
}

async fn unique_savings_goal_name(
    transaction: &mut Transaction<'_, Sqlite>,
    name: &str,
) -> Result<String, AppError> {
    unique_name(transaction, name, NameTable::SavingsGoals).await
}

enum NameTable {
    Accounts,
    SavingsGoals,
}

async fn unique_name(
    transaction: &mut Transaction<'_, Sqlite>,
    name: &str,
    table: NameTable,
) -> Result<String, AppError> {
    let base = format!("{name} (Imported)");
    let mut candidate = base.clone();
    let mut suffix = 2;

    while match table {
        NameTable::Accounts => account_name_exists_tx(transaction, &candidate).await?,
        NameTable::SavingsGoals => savings_goal_name_exists_tx(transaction, &candidate).await?,
    } {
        candidate = format!("{base} {suffix}");
        suffix += 1;
    }

    Ok(candidate)
}

async fn account_id_exists(pool: &SqlitePool, id: &str) -> Result<bool, AppError> {
    exists_pool(
        pool,
        "SELECT EXISTS(SELECT 1 FROM accounts WHERE id = ?)",
        id,
    )
    .await
}

async fn category_id_exists(pool: &SqlitePool, id: &str) -> Result<bool, AppError> {
    exists_pool(
        pool,
        "SELECT EXISTS(SELECT 1 FROM categories WHERE id = ?)",
        id,
    )
    .await
}

async fn transaction_id_exists(pool: &SqlitePool, id: &str) -> Result<bool, AppError> {
    exists_pool(
        pool,
        "SELECT EXISTS(SELECT 1 FROM transactions WHERE id = ?)",
        id,
    )
    .await
}

async fn budget_id_exists(pool: &SqlitePool, id: &str) -> Result<bool, AppError> {
    exists_pool(
        pool,
        "SELECT EXISTS(SELECT 1 FROM budgets WHERE id = ?)",
        id,
    )
    .await
}

async fn recurring_bill_id_exists(pool: &SqlitePool, id: &str) -> Result<bool, AppError> {
    exists_pool(
        pool,
        "SELECT EXISTS(SELECT 1 FROM recurring_bills WHERE id = ?)",
        id,
    )
    .await
}

async fn savings_goal_id_exists(pool: &SqlitePool, id: &str) -> Result<bool, AppError> {
    exists_pool(
        pool,
        "SELECT EXISTS(SELECT 1 FROM savings_goals WHERE id = ?)",
        id,
    )
    .await
}

async fn account_name_exists(pool: &SqlitePool, name: &str) -> Result<bool, AppError> {
    exists_pool(
        pool,
        "SELECT EXISTS(SELECT 1 FROM accounts WHERE name = ?)",
        name,
    )
    .await
}

async fn category_name_exists(pool: &SqlitePool, name: &str) -> Result<bool, AppError> {
    exists_pool(
        pool,
        "SELECT EXISTS(SELECT 1 FROM categories WHERE name = ?)",
        name,
    )
    .await
}

async fn category_id_by_name_type(
    pool: &SqlitePool,
    name: &str,
    category_type: &str,
) -> Result<Option<String>, AppError> {
    Ok(sqlx::query_scalar(
        "SELECT id FROM categories WHERE name = ? AND category_type = ? ORDER BY created_at DESC LIMIT 1",
    )
    .bind(name)
    .bind(category_type)
    .fetch_optional(pool)
    .await?)
}

async fn savings_goal_name_exists(pool: &SqlitePool, name: &str) -> Result<bool, AppError> {
    exists_pool(
        pool,
        "SELECT EXISTS(SELECT 1 FROM savings_goals WHERE name = ?)",
        name,
    )
    .await
}

async fn duplicate_transaction_exists(
    pool: &SqlitePool,
    item: &ImportTransaction,
    category_id: &str,
) -> Result<bool, AppError> {
    let exists: i64 = sqlx::query_scalar(
        r#"
        SELECT EXISTS(
            SELECT 1 FROM transactions
            WHERE account_id = ?
                AND category_id = ?
                AND transaction_date = ?
                AND amount_minor = ?
                AND transaction_type = ?
                AND COALESCE(description, '') = COALESCE(?, '')
        )
        "#,
    )
    .bind(&item.account_id)
    .bind(category_id)
    .bind(&item.transaction_date)
    .bind(item.amount_minor)
    .bind(&item.transaction_type)
    .bind(&item.description)
    .fetch_one(pool)
    .await?;
    Ok(exists == 1)
}

async fn duplicate_budget_exists(
    pool: &SqlitePool,
    category_id: &str,
    month: i64,
    year: i64,
) -> Result<bool, AppError> {
    let exists: i64 = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM budgets WHERE category_id = ? AND month = ? AND year = ?)",
    )
    .bind(category_id)
    .bind(month)
    .bind(year)
    .fetch_one(pool)
    .await?;
    Ok(exists == 1)
}

async fn duplicate_recurring_bill_exists(
    pool: &SqlitePool,
    bill: &ImportRecurringBill,
) -> Result<bool, AppError> {
    let exists: i64 = sqlx::query_scalar(
        r#"
        SELECT EXISTS(
            SELECT 1 FROM recurring_bills
            WHERE name = ?
                AND amount_minor = ?
                AND next_due_date = ?
                AND frequency = ?
        )
        "#,
    )
    .bind(&bill.name)
    .bind(bill.amount_minor)
    .bind(&bill.next_due_date)
    .bind(&bill.frequency)
    .fetch_one(pool)
    .await?;
    Ok(exists == 1)
}

async fn exists_pool(pool: &SqlitePool, sql: &'static str, value: &str) -> Result<bool, AppError> {
    let exists: i64 = sqlx::query_scalar(sql).bind(value).fetch_one(pool).await?;
    Ok(exists == 1)
}

async fn account_id_exists_tx(
    transaction: &mut Transaction<'_, Sqlite>,
    id: &str,
) -> Result<bool, AppError> {
    exists_tx(
        transaction,
        "SELECT EXISTS(SELECT 1 FROM accounts WHERE id = ?)",
        id,
    )
    .await
}

async fn category_id_exists_tx(
    transaction: &mut Transaction<'_, Sqlite>,
    id: &str,
) -> Result<bool, AppError> {
    exists_tx(
        transaction,
        "SELECT EXISTS(SELECT 1 FROM categories WHERE id = ?)",
        id,
    )
    .await
}

async fn transaction_id_exists_tx(
    transaction: &mut Transaction<'_, Sqlite>,
    id: &str,
) -> Result<bool, AppError> {
    exists_tx(
        transaction,
        "SELECT EXISTS(SELECT 1 FROM transactions WHERE id = ?)",
        id,
    )
    .await
}

async fn budget_id_exists_tx(
    transaction: &mut Transaction<'_, Sqlite>,
    id: &str,
) -> Result<bool, AppError> {
    exists_tx(
        transaction,
        "SELECT EXISTS(SELECT 1 FROM budgets WHERE id = ?)",
        id,
    )
    .await
}

async fn recurring_bill_id_exists_tx(
    transaction: &mut Transaction<'_, Sqlite>,
    id: &str,
) -> Result<bool, AppError> {
    exists_tx(
        transaction,
        "SELECT EXISTS(SELECT 1 FROM recurring_bills WHERE id = ?)",
        id,
    )
    .await
}

async fn savings_goal_id_exists_tx(
    transaction: &mut Transaction<'_, Sqlite>,
    id: &str,
) -> Result<bool, AppError> {
    exists_tx(
        transaction,
        "SELECT EXISTS(SELECT 1 FROM savings_goals WHERE id = ?)",
        id,
    )
    .await
}

async fn account_name_exists_tx(
    transaction: &mut Transaction<'_, Sqlite>,
    name: &str,
) -> Result<bool, AppError> {
    exists_tx(
        transaction,
        "SELECT EXISTS(SELECT 1 FROM accounts WHERE name = ?)",
        name,
    )
    .await
}

async fn category_name_exists_tx(
    transaction: &mut Transaction<'_, Sqlite>,
    name: &str,
) -> Result<bool, AppError> {
    exists_tx(
        transaction,
        "SELECT EXISTS(SELECT 1 FROM categories WHERE name = ?)",
        name,
    )
    .await
}

async fn savings_goal_name_exists_tx(
    transaction: &mut Transaction<'_, Sqlite>,
    name: &str,
) -> Result<bool, AppError> {
    exists_tx(
        transaction,
        "SELECT EXISTS(SELECT 1 FROM savings_goals WHERE name = ?)",
        name,
    )
    .await
}

async fn category_id_by_name_type_tx(
    transaction: &mut Transaction<'_, Sqlite>,
    name: &str,
    category_type: &str,
) -> Result<Option<String>, AppError> {
    Ok(sqlx::query_scalar(
        "SELECT id FROM categories WHERE name = ? AND category_type = ? ORDER BY created_at DESC LIMIT 1",
    )
    .bind(name)
    .bind(category_type)
    .fetch_optional(&mut **transaction)
    .await?)
}

async fn duplicate_transaction_exists_tx(
    transaction: &mut Transaction<'_, Sqlite>,
    item: &ImportTransaction,
    category_id: &str,
) -> Result<bool, AppError> {
    let exists: i64 = sqlx::query_scalar(
        r#"
        SELECT EXISTS(
            SELECT 1 FROM transactions
            WHERE account_id = ?
                AND category_id = ?
                AND transaction_date = ?
                AND amount_minor = ?
                AND transaction_type = ?
                AND COALESCE(description, '') = COALESCE(?, '')
        )
        "#,
    )
    .bind(&item.account_id)
    .bind(category_id)
    .bind(&item.transaction_date)
    .bind(item.amount_minor)
    .bind(&item.transaction_type)
    .bind(&item.description)
    .fetch_one(&mut **transaction)
    .await?;
    Ok(exists == 1)
}

async fn duplicate_budget_exists_tx(
    transaction: &mut Transaction<'_, Sqlite>,
    category_id: &str,
    month: i64,
    year: i64,
) -> Result<bool, AppError> {
    let exists: i64 = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM budgets WHERE category_id = ? AND month = ? AND year = ?)",
    )
    .bind(category_id)
    .bind(month)
    .bind(year)
    .fetch_one(&mut **transaction)
    .await?;
    Ok(exists == 1)
}

async fn duplicate_recurring_bill_exists_tx(
    transaction: &mut Transaction<'_, Sqlite>,
    bill: &ImportRecurringBill,
) -> Result<bool, AppError> {
    let exists: i64 = sqlx::query_scalar(
        r#"
        SELECT EXISTS(
            SELECT 1 FROM recurring_bills
            WHERE name = ?
                AND amount_minor = ?
                AND next_due_date = ?
                AND frequency = ?
        )
        "#,
    )
    .bind(&bill.name)
    .bind(bill.amount_minor)
    .bind(&bill.next_due_date)
    .bind(&bill.frequency)
    .fetch_one(&mut **transaction)
    .await?;
    Ok(exists == 1)
}

async fn exists_tx(
    transaction: &mut Transaction<'_, Sqlite>,
    sql: &'static str,
    value: &str,
) -> Result<bool, AppError> {
    let exists: i64 = sqlx::query_scalar(sql)
        .bind(value)
        .fetch_one(&mut **transaction)
        .await?;
    Ok(exists == 1)
}

fn validate_unique_entities<'a>(
    entity: &str,
    ids: impl Iterator<Item = &'a str>,
) -> Result<(), AppError> {
    let mut seen = HashSet::new();
    for id in ids {
        require_non_empty(&format!("{entity}.id"), id)?;
        if !seen.insert(id.to_string()) {
            return Err(AppError::Validation(format!(
                "Import file contains duplicate {entity} id '{id}'."
            )));
        }
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
