use serde_json::json;
use wallet_lib::services::export::service::ExportService;
use wallet_lib::services::r#import::dto::ImportMode;
use wallet_lib::services::r#import::service::ImportService;

use crate::common::fixtures;
use crate::common::test_db;

#[tokio::test]
async fn valid_import_merges_missing_records_and_preserves_existing_data() {
    let source_db = test_db::create_test_db().await;
    let account = fixtures::create_account(&source_db.pool).await.unwrap();
    let income_category = fixtures::create_income_category(&source_db.pool)
        .await
        .unwrap();
    let expense_category = fixtures::create_expense_category(&source_db.pool)
        .await
        .unwrap();

    fixtures::create_income_transaction(&source_db.pool, &account.id, &income_category.id)
        .await
        .unwrap();
    fixtures::create_budget(&source_db.pool, &expense_category.id)
        .await
        .unwrap();
    fixtures::create_recurring_bill(&source_db.pool, &account.id, &expense_category.id)
        .await
        .unwrap();
    fixtures::create_savings_goal(&source_db.pool)
        .await
        .unwrap();

    let json = ExportService::export_json(&source_db.pool).await.unwrap();

    let target_db = test_db::create_test_db().await;
    let existing_account = fixtures::create_account(&target_db.pool).await.unwrap();

    let result = ImportService::import_json(&target_db.pool, &json, ImportMode::Merge)
        .await
        .unwrap();

    assert_eq!(result.summary.accounts, 1);
    assert_eq!(result.imported.accounts, 1);
    assert_eq!(count_accounts(&target_db.pool).await, 2);
    assert!(account_exists(&target_db.pool, &existing_account.id).await);
    assert_eq!(count_categories(&target_db.pool).await, 2);
    assert_eq!(count_transactions(&target_db.pool).await, 1);
    assert_eq!(count_budgets(&target_db.pool).await, 1);
    assert_eq!(count_recurring_bills(&target_db.pool).await, 1);
    assert_eq!(count_savings_goals(&target_db.pool).await, 1);

    let second_result = ImportService::import_json(&target_db.pool, &json, ImportMode::Merge)
        .await
        .unwrap();
    assert_eq!(second_result.imported.accounts, 0);
    assert_eq!(second_result.skipped.accounts, 1);
    assert_eq!(second_result.imported.transactions, 0);
    assert_eq!(second_result.skipped.transactions, 1);
    assert_eq!(count_accounts(&target_db.pool).await, 2);

    source_db.close().await;
    target_db.close().await;
}

#[test]
fn invalid_json_is_rejected() {
    let result = ImportService::validate_json("{not-json");

    assert!(result.is_err());
    assert!(result
        .unwrap_err()
        .to_string()
        .contains("Import file is not valid JSON"));
}

#[test]
fn invalid_export_version_is_rejected() {
    let json = valid_empty_export_json_with_version("9.0");
    let result = ImportService::validate_json(&json);

    assert!(result.is_err());
    assert!(result
        .unwrap_err()
        .to_string()
        .contains("Unsupported import version"));
}

#[test]
fn missing_required_properties_are_rejected() {
    let result = ImportService::validate_json("{}");

    assert!(result.is_err());
    assert!(result
        .unwrap_err()
        .to_string()
        .contains("missing required property 'version'"));
}

#[tokio::test]
async fn empty_export_file_imports_zero_records() {
    let db = test_db::create_test_db().await;
    let json = valid_empty_export_json_with_version("1.0");

    let preview = ImportService::preview(&db.pool, &json).await.unwrap();
    let result = ImportService::import_json(&db.pool, &json, ImportMode::Merge)
        .await
        .unwrap();

    assert_eq!(preview.summary.accounts, 0);
    assert_eq!(preview.summary.transactions, 0);
    assert!(!preview.warnings.is_empty());
    assert_eq!(result.imported.accounts, 0);
    assert_eq!(result.imported.transactions, 0);
    assert_eq!(count_accounts(&db.pool).await, 0);
    db.close().await;
}

#[tokio::test]
async fn merge_import_skips_exact_duplicate_categories() {
    let source_db = test_db::create_test_db().await;
    fixtures::create_expense_category(&source_db.pool)
        .await
        .unwrap();
    let json = ExportService::export_json(&source_db.pool).await.unwrap();

    let target_db = test_db::create_test_db().await;
    fixtures::create_expense_category(&target_db.pool)
        .await
        .unwrap();

    let preview = ImportService::preview(&target_db.pool, &json)
        .await
        .unwrap();
    let result = ImportService::import_json(&target_db.pool, &json, ImportMode::Merge)
        .await
        .unwrap();

    assert_eq!(preview.duplicates.categories, 1);
    assert_eq!(result.imported.categories, 0);
    assert_eq!(result.skipped.categories, 1);
    assert_eq!(count_categories(&target_db.pool).await, 1);

    source_db.close().await;
    target_db.close().await;
}

#[tokio::test]
async fn merge_import_skips_duplicate_transactions() {
    let source_db = test_db::create_test_db().await;
    let account = fixtures::create_account(&source_db.pool).await.unwrap();
    let category = fixtures::create_income_category(&source_db.pool)
        .await
        .unwrap();
    fixtures::create_income_transaction(&source_db.pool, &account.id, &category.id)
        .await
        .unwrap();
    let json = ExportService::export_json(&source_db.pool).await.unwrap();

    let target_db = test_db::create_test_db().await;
    ImportService::import_json(&target_db.pool, &json, ImportMode::Merge)
        .await
        .unwrap();
    let result = ImportService::import_json(&target_db.pool, &json, ImportMode::Merge)
        .await
        .unwrap();

    assert_eq!(result.imported.transactions, 0);
    assert_eq!(result.skipped.transactions, 1);
    assert_eq!(count_transactions(&target_db.pool).await, 1);

    source_db.close().await;
    target_db.close().await;
}

#[tokio::test]
async fn replace_import_clears_existing_data_then_imports_file() {
    let source_db = test_db::create_test_db().await;
    let source_account = fixtures::create_account(&source_db.pool).await.unwrap();
    let json = ExportService::export_json(&source_db.pool).await.unwrap();

    let target_db = test_db::create_test_db().await;
    let existing_account = fixtures::create_account(&target_db.pool).await.unwrap();

    let result = ImportService::import_json(&target_db.pool, &json, ImportMode::Replace)
        .await
        .unwrap();

    assert_eq!(result.mode, "replace");
    assert_eq!(result.imported.accounts, 1);
    assert_eq!(count_accounts(&target_db.pool).await, 1);
    assert!(account_exists(&target_db.pool, &source_account.id).await);
    assert!(!account_exists(&target_db.pool, &existing_account.id).await);

    source_db.close().await;
    target_db.close().await;
}

fn valid_empty_export_json_with_version(version: &str) -> String {
    json!({
        "version": version,
        "exportedAt": "2026-06-11T00:00:00Z",
        "accounts": [],
        "categories": [],
        "transactions": [],
        "budgets": [],
        "recurringBills": [],
        "savingsGoals": []
    })
    .to_string()
}

async fn count_accounts(pool: &sqlx::SqlitePool) -> i64 {
    sqlx::query_scalar("SELECT COUNT(*) FROM accounts")
        .fetch_one(pool)
        .await
        .unwrap()
}

async fn count_categories(pool: &sqlx::SqlitePool) -> i64 {
    sqlx::query_scalar("SELECT COUNT(*) FROM categories")
        .fetch_one(pool)
        .await
        .unwrap()
}

async fn count_transactions(pool: &sqlx::SqlitePool) -> i64 {
    sqlx::query_scalar("SELECT COUNT(*) FROM transactions")
        .fetch_one(pool)
        .await
        .unwrap()
}

async fn count_budgets(pool: &sqlx::SqlitePool) -> i64 {
    sqlx::query_scalar("SELECT COUNT(*) FROM budgets")
        .fetch_one(pool)
        .await
        .unwrap()
}

async fn count_recurring_bills(pool: &sqlx::SqlitePool) -> i64 {
    sqlx::query_scalar("SELECT COUNT(*) FROM recurring_bills")
        .fetch_one(pool)
        .await
        .unwrap()
}

async fn count_savings_goals(pool: &sqlx::SqlitePool) -> i64 {
    sqlx::query_scalar("SELECT COUNT(*) FROM savings_goals")
        .fetch_one(pool)
        .await
        .unwrap()
}

async fn account_exists(pool: &sqlx::SqlitePool, id: &str) -> bool {
    let exists: i64 = sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM accounts WHERE id = ?)")
        .bind(id)
        .fetch_one(pool)
        .await
        .unwrap();
    exists == 1
}
#[tokio::test]
async fn valid_import_preview_reports_counts() {
    let source_db = test_db::create_test_db().await;
    let account = fixtures::create_account(&source_db.pool).await.unwrap();
    let category = fixtures::create_income_category(&source_db.pool)
        .await
        .unwrap();
    fixtures::create_income_transaction(&source_db.pool, &account.id, &category.id)
        .await
        .unwrap();
    let json = ExportService::export_json(&source_db.pool).await.unwrap();

    let target_db = test_db::create_test_db().await;
    let preview = ImportService::preview(&target_db.pool, &json)
        .await
        .unwrap();

    assert_eq!(preview.summary.accounts, 1);
    assert_eq!(preview.summary.categories, 1);
    assert_eq!(preview.summary.transactions, 1);
    assert_eq!(preview.duplicates.accounts, 0);
    assert_eq!(preview.conflicts.accounts, 0);

    source_db.close().await;
    target_db.close().await;
}
