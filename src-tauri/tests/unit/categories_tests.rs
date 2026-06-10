use wallet_lib::domain::categories::dto::CreateCategoryRequest;
use wallet_lib::domain::categories::service::CategoryService;

use crate::common::test_db;

#[tokio::test]
async fn create_category_requires_name() {
    let db = test_db::create_test_db().await;

    let result = CategoryService::create(
        &db.pool,
        CreateCategoryRequest {
            name: "".to_string(),
            category_type: "expense".to_string(),
            icon: None,
            color: None,
        },
    )
    .await;

    assert_eq!(
        result.unwrap_err().to_string(),
        "Category name is required."
    );
    db.close().await;
}

#[tokio::test]
async fn create_category_requires_income_or_expense_type() {
    let db = test_db::create_test_db().await;

    let result = CategoryService::create(
        &db.pool,
        CreateCategoryRequest {
            name: "Mystery".to_string(),
            category_type: "transfer".to_string(),
            icon: None,
            color: None,
        },
    )
    .await;

    assert_eq!(
        result.unwrap_err().to_string(),
        "Category type must be income or expense."
    );
    db.close().await;
}

#[tokio::test]
async fn create_category_trims_name_and_normalizes_type() {
    let db = test_db::create_test_db().await;

    let category = CategoryService::create(
        &db.pool,
        CreateCategoryRequest {
            name: "  Salary  ".to_string(),
            category_type: "INCOME".to_string(),
            icon: Some(" ".to_string()),
            color: Some("#fff".to_string()),
        },
    )
    .await
    .unwrap();

    assert_eq!(category.name, "Salary");
    assert_eq!(category.category_type, "income");
    assert_eq!(category.icon, None);
    assert_eq!(category.color, Some("#fff".to_string()));
    db.close().await;
}
