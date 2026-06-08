use sqlx::SqlitePool;

use crate::domain::categories::dto::CreateCategoryRequest;
use crate::domain::categories::model::Category;
use crate::errors::app_error::AppError;
use crate::repositories::category_repository::CategoryRepository;

pub struct CategoryService;

impl CategoryService {
    pub async fn create(
        pool: &SqlitePool,
        request: CreateCategoryRequest,
    ) -> Result<Category, AppError> {
        let name = request.name.trim().to_string();
        if name.is_empty() {
            return Err(AppError::Validation(
                "Category name is required.".to_string(),
            ));
        }

        let category_type = request.category_type.trim().to_lowercase();
        if category_type != "income" && category_type != "expense" {
            return Err(AppError::Validation(
                "Category type must be income or expense.".to_string(),
            ));
        }

        let icon = empty_string_to_none(request.icon);
        let color = empty_string_to_none(request.color);

        CategoryRepository::create(pool, name, category_type, icon, color).await
    }

    pub async fn list(pool: &SqlitePool) -> Result<Vec<Category>, AppError> {
        CategoryRepository::list(pool).await
    }
}

fn empty_string_to_none(value: Option<String>) -> Option<String> {
    let value = value?.trim().to_string();
    if value.is_empty() {
        None
    } else {
        Some(value)
    }
}
