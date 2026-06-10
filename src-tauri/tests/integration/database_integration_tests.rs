use wallet_lib::domain::accounts::service::AccountService;
use wallet_lib::repositories::account_repository::AccountRepository;
use wallet_lib::repositories::transaction_repository::TransactionRepository;

use crate::common::fixtures;
use crate::common::test_db;

#[tokio::test]
async fn test_database_uses_obvious_temp_directory_and_migrations() {
    let db = test_db::create_test_db().await;
    let db_dir = db.path().to_string_lossy().to_lowercase();

    assert!(db_dir.contains("temp") || db_dir.contains("tmp"));

    let tables: Vec<String> = sqlx::query_scalar(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN (?, ?, ?, ?, ?, ?)",
    )
    .bind("accounts")
    .bind("categories")
    .bind("transactions")
    .bind("budgets")
    .bind("savings_goals")
    .bind("recurring_bills")
    .fetch_all(&db.pool)
    .await
    .unwrap();

    assert_eq!(tables.len(), 6);
    db.close().await;
}

#[tokio::test]
async fn repository_crud_works_against_isolated_database() {
    let db = test_db::create_test_db().await;

    let account = AccountRepository::create(
        &db.pool,
        "Wallet".to_string(),
        "cash".to_string(),
        "MAD".to_string(),
        100,
    )
    .await
    .unwrap();
    let found = AccountRepository::find_by_id(&db.pool, &account.id)
        .await
        .unwrap()
        .unwrap();
    let updated = AccountRepository::update(
        &db.pool,
        account.id.clone(),
        "Daily Wallet".to_string(),
        "cash".to_string(),
        "MAD".to_string(),
    )
    .await
    .unwrap();
    let archived = AccountRepository::archive(&db.pool, &account.id)
        .await
        .unwrap();

    assert_eq!(found.name, "Wallet");
    assert_eq!(updated.name, "Daily Wallet");
    assert_eq!(archived, 1);
    assert!(AccountService::list(&db.pool).await.unwrap().is_empty());
    db.close().await;
}

#[tokio::test]
async fn foreign_keys_are_enabled_for_test_database() {
    let db = test_db::create_test_db().await;
    let result = TransactionRepository::create(
        &db.pool,
        "missing-account".to_string(),
        "missing-category".to_string(),
        "expense".to_string(),
        100,
        None,
        "2026-06-10".to_string(),
    )
    .await;

    assert!(result.is_err());
    db.close().await;
}

#[tokio::test]
async fn service_crud_round_trip_uses_only_test_data() {
    let db = test_db::create_test_db().await;

    let account = fixtures::create_account(&db.pool).await.unwrap();
    let category = fixtures::create_expense_category(&db.pool).await.unwrap();
    let transaction = fixtures::create_expense_transaction(&db.pool, &account.id, &category.id)
        .await
        .unwrap();

    assert_eq!(AccountService::list(&db.pool).await.unwrap().len(), 1);
    assert_eq!(
        TransactionRepository::find_by_id(&db.pool, &transaction.id)
            .await
            .unwrap()
            .unwrap()
            .amount_minor,
        3_500
    );
    db.close().await;
}
