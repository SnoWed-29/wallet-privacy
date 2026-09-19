use serde_json::Value;
use wallet_lib::services::backup::dto::BACKUP_VERSION;
use wallet_lib::services::backup::service::BackupService;
use wallet_lib::services::export::service::ExportService;

use crate::common::fixtures;
use crate::common::test_db;

#[tokio::test]
async fn backup_generation_wraps_export_data_with_metadata() {
    let db = test_db::create_test_db().await;
    let account = fixtures::create_account(&db.pool).await.unwrap();
    let category = fixtures::create_income_category(&db.pool).await.unwrap();
    fixtures::create_income_transaction(&db.pool, &account.id, &category.id)
        .await
        .unwrap();

    let json = BackupService::create_backup_json(&db.pool).await.unwrap();
    let parsed: Value = serde_json::from_str(&json).unwrap();

    assert_eq!(parsed["backupVersion"], BACKUP_VERSION);
    assert!(parsed["createdAt"].as_str().is_some());
    assert!(parsed["appVersion"].as_str().is_some());
    assert_eq!(parsed["dataCounts"]["accounts"], 1);
    assert_eq!(parsed["dataCounts"]["categories"], 1);
    assert_eq!(parsed["dataCounts"]["transactions"], 1);
    assert_eq!(parsed["data"]["accounts"].as_array().unwrap().len(), 1);
    db.close().await;
}

#[test]
fn backup_filename_generation_uses_clear_date_pattern() {
    assert_eq!(
        BackupService::backup_file_name_for_date("2026-06-12"),
        "wallet-backup-2026-06-12.json"
    );
}

#[tokio::test]
async fn valid_backup_file_returns_restore_preview() {
    let db = test_db::create_test_db().await;
    fixtures::create_account(&db.pool).await.unwrap();

    let json = BackupService::create_backup_json(&db.pool).await.unwrap();
    let preview = BackupService::validate_backup_json(&db.pool, &json)
        .await
        .unwrap();

    assert_eq!(preview.metadata.backup_version, BACKUP_VERSION);
    assert_eq!(preview.summary.accounts, 1);
    assert_eq!(preview.duplicates.accounts, 1);
    db.close().await;
}

#[tokio::test]
async fn invalid_backup_file_is_rejected() {
    let db = test_db::create_test_db().await;
    let result = BackupService::validate_backup_json(&db.pool, "{not-json").await;

    assert!(result.is_err());
    assert!(result
        .unwrap_err()
        .to_string()
        .contains("Backup file is not valid JSON"));
    db.close().await;
}

#[tokio::test]
async fn restore_backup_replaces_current_data_without_merging() {
    let source_db = test_db::create_test_db().await;
    let source_account = fixtures::create_account(&source_db.pool).await.unwrap();
    let backup_json = BackupService::create_backup_json(&source_db.pool)
        .await
        .unwrap();

    let target_db = test_db::create_test_db().await;
    let existing_account = fixtures::create_account(&target_db.pool).await.unwrap();

    let result = BackupService::restore_backup_json(&target_db.pool, &backup_json)
        .await
        .unwrap();

    assert_eq!(result.restored.mode, "replace");
    assert_eq!(result.restored.imported.accounts, 1);
    assert!(result.safety_backup_json.contains(&existing_account.id));
    assert_eq!(count_accounts(&target_db.pool).await, 1);
    assert!(account_exists(&target_db.pool, &source_account.id).await);
    assert!(!account_exists(&target_db.pool, &existing_account.id).await);

    source_db.close().await;
    target_db.close().await;
}

#[tokio::test]
async fn restore_empty_backup_clears_current_data() {
    let source_db = test_db::create_test_db().await;
    let backup_json = BackupService::create_backup_json(&source_db.pool)
        .await
        .unwrap();

    let target_db = test_db::create_test_db().await;
    fixtures::create_account(&target_db.pool).await.unwrap();

    BackupService::restore_backup_json(&target_db.pool, &backup_json)
        .await
        .unwrap();

    assert_eq!(count_accounts(&target_db.pool).await, 0);
    source_db.close().await;
    target_db.close().await;
}

#[tokio::test]
async fn restore_failure_leaves_existing_data_in_place() {
    let source_db = test_db::create_test_db().await;
    let account = fixtures::create_account(&source_db.pool).await.unwrap();
    let category = fixtures::create_income_category(&source_db.pool)
        .await
        .unwrap();
    fixtures::create_income_transaction(&source_db.pool, &account.id, &category.id)
        .await
        .unwrap();
    let export = ExportService::export(&source_db.pool).await.unwrap();
    let mut backup = BackupService::build_backup(
        "2026-06-12T00:00:00Z".to_string(),
        Some("test".to_string()),
        export,
    );
    backup.data.accounts.clear();
    let broken_json = serde_json::to_string(&backup).unwrap();

    let target_db = test_db::create_test_db().await;
    let existing_account = fixtures::create_account(&target_db.pool).await.unwrap();
    let result = BackupService::restore_backup_json(&target_db.pool, &broken_json).await;

    assert!(result.is_err());
    assert_eq!(count_accounts(&target_db.pool).await, 1);
    assert!(account_exists(&target_db.pool, &existing_account.id).await);
    assert!(!account_exists(&target_db.pool, &account.id).await);
    assert!(!category.id.is_empty());

    source_db.close().await;
    target_db.close().await;
}

async fn count_accounts(pool: &sqlx::SqlitePool) -> i64 {
    sqlx::query_scalar("SELECT COUNT(*) FROM accounts")
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
