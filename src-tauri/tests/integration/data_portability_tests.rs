use wallet_lib::services::backup::service::BackupService;
use wallet_lib::services::export::service::ExportService;
use wallet_lib::services::r#import::dto::ImportMode;
use wallet_lib::services::r#import::service::ImportService;

use crate::common::fixtures;
use crate::common::test_db;

#[tokio::test]
async fn export_import_merge_preserves_existing_data_and_imports_source() {
    let source_db = populated_wallet().await;
    let export_json = ExportService::export_json(&source_db.pool).await.unwrap();

    let target_db = test_db::create_test_db().await;
    let existing_account = fixtures::create_account(&target_db.pool).await.unwrap();

    ImportService::import_json(&target_db.pool, &export_json, ImportMode::Merge)
        .await
        .unwrap();

    assert!(account_exists(&target_db.pool, &existing_account.id).await);
    assert_eq!(count_rows(&target_db.pool, "accounts").await, 2);
    assert_eq!(count_rows(&target_db.pool, "transactions").await, 1);

    source_db.close().await;
    target_db.close().await;
}

#[tokio::test]
async fn export_restore_replaces_target_state() {
    let source_db = populated_wallet().await;
    let export_json = ExportService::export_json(&source_db.pool).await.unwrap();

    let target_db = test_db::create_test_db().await;
    let existing_account = fixtures::create_account(&target_db.pool).await.unwrap();

    ImportService::import_json(&target_db.pool, &export_json, ImportMode::Replace)
        .await
        .unwrap();

    assert_eq!(count_rows(&target_db.pool, "accounts").await, 1);
    assert!(!account_exists(&target_db.pool, &existing_account.id).await);
    assert_eq!(count_rows(&target_db.pool, "transactions").await, 1);

    source_db.close().await;
    target_db.close().await;
}

#[tokio::test]
async fn backup_restore_matches_source_counts() {
    let source_db = populated_wallet().await;
    let backup_json = BackupService::create_backup_json(&source_db.pool)
        .await
        .unwrap();

    let target_db = test_db::create_test_db().await;
    BackupService::restore_backup_json(&target_db.pool, &backup_json)
        .await
        .unwrap();

    assert_eq!(count_rows(&target_db.pool, "accounts").await, 1);
    assert_eq!(count_rows(&target_db.pool, "categories").await, 2);
    assert_eq!(count_rows(&target_db.pool, "transactions").await, 1);
    assert_eq!(count_rows(&target_db.pool, "budgets").await, 1);
    assert_eq!(count_rows(&target_db.pool, "recurring_bills").await, 1);
    assert_eq!(count_rows(&target_db.pool, "savings_goals").await, 1);

    source_db.close().await;
    target_db.close().await;
}

#[tokio::test]
async fn duplicate_import_skips_duplicates() {
    let source_db = populated_wallet().await;
    let export_json = ExportService::export_json(&source_db.pool).await.unwrap();

    let target_db = test_db::create_test_db().await;
    ImportService::import_json(&target_db.pool, &export_json, ImportMode::Merge)
        .await
        .unwrap();
    let result = ImportService::import_json(&target_db.pool, &export_json, ImportMode::Merge)
        .await
        .unwrap();

    assert_eq!(result.imported.transactions, 0);
    assert_eq!(result.skipped.transactions, 1);
    assert_eq!(count_rows(&target_db.pool, "transactions").await, 1);

    source_db.close().await;
    target_db.close().await;
}

#[tokio::test]
async fn merge_conflicts_use_imported_name_strategy() {
    let source_db = test_db::create_test_db().await;
    fixtures::create_account(&source_db.pool).await.unwrap();
    let export_json = ExportService::export_json(&source_db.pool).await.unwrap();

    let target_db = test_db::create_test_db().await;
    fixtures::create_account(&target_db.pool).await.unwrap();
    let result = ImportService::import_json(&target_db.pool, &export_json, ImportMode::Merge)
        .await
        .unwrap();

    assert_eq!(result.conflicts.accounts, 1);
    assert!(account_name_exists(&target_db.pool, "Checking (Imported)").await);

    source_db.close().await;
    target_db.close().await;
}

#[tokio::test]
async fn invalid_backup_blocks_restore() {
    let target_db = test_db::create_test_db().await;
    let existing_account = fixtures::create_account(&target_db.pool).await.unwrap();

    let result = BackupService::restore_backup_json(&target_db.pool, "{}").await;

    assert!(result.is_err());
    assert_eq!(count_rows(&target_db.pool, "accounts").await, 1);
    assert!(account_exists(&target_db.pool, &existing_account.id).await);

    target_db.close().await;
}

async fn populated_wallet() -> test_db::TestDb {
    let db = test_db::create_test_db().await;
    let account = fixtures::create_account(&db.pool).await.unwrap();
    let income_category = fixtures::create_income_category(&db.pool).await.unwrap();
    let expense_category = fixtures::create_expense_category(&db.pool).await.unwrap();
    fixtures::create_income_transaction(&db.pool, &account.id, &income_category.id)
        .await
        .unwrap();
    fixtures::create_budget(&db.pool, &expense_category.id)
        .await
        .unwrap();
    fixtures::create_recurring_bill(&db.pool, &account.id, &expense_category.id)
        .await
        .unwrap();
    fixtures::create_savings_goal(&db.pool).await.unwrap();
    db
}

async fn count_rows(pool: &sqlx::SqlitePool, table: &str) -> i64 {
    let sql = match table {
        "accounts" => "SELECT COUNT(*) FROM accounts",
        "categories" => "SELECT COUNT(*) FROM categories",
        "transactions" => "SELECT COUNT(*) FROM transactions",
        "budgets" => "SELECT COUNT(*) FROM budgets",
        "recurring_bills" => "SELECT COUNT(*) FROM recurring_bills",
        "savings_goals" => "SELECT COUNT(*) FROM savings_goals",
        _ => panic!("unsupported test table: {table}"),
    };
    sqlx::query_scalar(sql).fetch_one(pool).await.unwrap()
}

async fn account_exists(pool: &sqlx::SqlitePool, id: &str) -> bool {
    let exists: i64 = sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM accounts WHERE id = ?)")
        .bind(id)
        .fetch_one(pool)
        .await
        .unwrap();
    exists == 1
}

async fn account_name_exists(pool: &sqlx::SqlitePool, name: &str) -> bool {
    let exists: i64 = sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM accounts WHERE name = ?)")
        .bind(name)
        .fetch_one(pool)
        .await
        .unwrap();
    exists == 1
}
