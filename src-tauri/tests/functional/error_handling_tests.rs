use serde_json::json;
use wallet_lib::domain::accounts::dto::ArchiveAccountRequest;
use wallet_lib::domain::accounts::service::AccountService;
use wallet_lib::errors::app_error::AppError;

use crate::common::test_db;

#[test]
fn validation_errors_serialize_to_readable_message() {
    let error = AppError::Validation("A readable validation message.".to_string());
    let serialized = serde_json::to_value(&error).unwrap();

    assert_eq!(serialized, json!("A readable validation message."));
}

#[tokio::test]
async fn missing_entity_errors_are_readable() {
    let db = test_db::create_test_db().await;

    let result = AccountService::archive(
        &db.pool,
        ArchiveAccountRequest {
            id: "missing-account".to_string(),
        },
    )
    .await;

    assert_eq!(result.unwrap_err().to_string(), "Account does not exist.");
    db.close().await;
}
