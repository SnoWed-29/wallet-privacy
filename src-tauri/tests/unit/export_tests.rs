use serde_json::Value;
use wallet_lib::services::export::dto::EXPORT_VERSION;
use wallet_lib::services::export::service::ExportService;

use crate::common::fixtures;
use crate::common::test_db;

#[test]
fn build_export_dto_includes_version_metadata_and_collections() {
    let export = ExportService::build_export(
        "2026-06-11T00:00:00Z".to_string(),
        Vec::new(),
        Vec::new(),
        Vec::new(),
        Vec::new(),
        Vec::new(),
        Vec::new(),
    );

    assert_eq!(export.version, EXPORT_VERSION);
    assert_eq!(export.exported_at, "2026-06-11T00:00:00Z");
    assert!(export.accounts.is_empty());
    assert!(export.categories.is_empty());
    assert!(export.transactions.is_empty());
    assert!(export.budgets.is_empty());
    assert!(export.recurring_bills.is_empty());
    assert!(export.savings_goals.is_empty());
}

#[tokio::test]
async fn export_service_includes_supported_wallet_entities() {
    let db = test_db::create_test_db().await;
    let account = fixtures::create_account(&db.pool).await.unwrap();
    let income_category = fixtures::create_income_category(&db.pool).await.unwrap();
    let expense_category = fixtures::create_expense_category(&db.pool).await.unwrap();

    fixtures::create_income_transaction(&db.pool, &account.id, &income_category.id)
        .await
        .unwrap();
    fixtures::create_expense_transaction(&db.pool, &account.id, &expense_category.id)
        .await
        .unwrap();
    fixtures::create_budget(&db.pool, &expense_category.id)
        .await
        .unwrap();
    fixtures::create_recurring_bill(&db.pool, &account.id, &expense_category.id)
        .await
        .unwrap();
    fixtures::create_savings_goal(&db.pool).await.unwrap();

    let export = ExportService::export(&db.pool).await.unwrap();

    assert_eq!(export.version, EXPORT_VERSION);
    assert_eq!(export.accounts.len(), 1);
    assert_eq!(export.categories.len(), 2);
    assert_eq!(export.transactions.len(), 2);
    assert_eq!(export.budgets.len(), 1);
    assert_eq!(export.recurring_bills.len(), 1);
    assert_eq!(export.savings_goals.len(), 1);
    db.close().await;
}

#[tokio::test]
async fn empty_database_export_is_valid_json_with_empty_arrays() {
    let db = test_db::create_test_db().await;

    let json = ExportService::export_json(&db.pool).await.unwrap();
    let parsed: Value = serde_json::from_str(&json).unwrap();

    assert_eq!(parsed["version"], EXPORT_VERSION);
    assert!(parsed["exportedAt"].as_str().is_some());
    assert_eq!(parsed["accounts"].as_array().unwrap().len(), 0);
    assert_eq!(parsed["categories"].as_array().unwrap().len(), 0);
    assert_eq!(parsed["transactions"].as_array().unwrap().len(), 0);
    assert_eq!(parsed["budgets"].as_array().unwrap().len(), 0);
    assert_eq!(parsed["recurringBills"].as_array().unwrap().len(), 0);
    assert_eq!(parsed["savingsGoals"].as_array().unwrap().len(), 0);
    db.close().await;
}
