use chrono::Utc;
use sqlx::SqlitePool;
use uuid::Uuid;

use crate::domain::categories::model::Category;
use crate::errors::app_error::AppError;

pub struct CategoryRepository;

impl CategoryRepository {
    pub async fn create(
        pool: &SqlitePool,
        name: String,
        category_type: String,
        icon: Option<String>,
        color: Option<String>,
    ) -> Result<Category, AppError> {
        let now = Utc::now().to_rfc3339();
        let category = Category {
            id: Uuid::new_v4().to_string(),
            name,
            category_type,
            icon,
            color,
            is_archived: false,
            created_at: now.clone(),
            updated_at: now,
        };

        sqlx::query(
            r#"
            INSERT INTO categories (
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
        .execute(pool)
        .await?;

        Ok(category)
    }

    pub async fn list(pool: &SqlitePool) -> Result<Vec<Category>, AppError> {
        let categories = sqlx::query_as::<_, Category>(
            r#"
            SELECT
                id,
                name,
                category_type,
                icon,
                color,
                is_archived,
                created_at,
                updated_at
            FROM categories
            WHERE is_archived = 0
            ORDER BY created_at DESC
            "#,
        )
        .fetch_all(pool)
        .await?;

        Ok(categories)
    }

    pub async fn find_by_id(pool: &SqlitePool, id: &str) -> Result<Option<Category>, AppError> {
        let category = sqlx::query_as::<_, Category>(
            r#"
            SELECT
                id,
                name,
                category_type,
                icon,
                color,
                is_archived,
                created_at,
                updated_at
            FROM categories
            WHERE id = ?
            "#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(category)
    }
}
