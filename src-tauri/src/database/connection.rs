use std::str::FromStr;

use chrono::Utc;
use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
use sqlx::SqlitePool;
use tauri::{AppHandle, Manager};
use uuid::Uuid;

use crate::errors::app_error::AppError;

pub async fn initialize_database(app_handle: &AppHandle) -> Result<SqlitePool, AppError> {
    let app_data_dir = app_handle.path().app_data_dir()?;
    tokio::fs::create_dir_all(&app_data_dir).await?;

    let database_path = app_data_dir.join("wallet.db");
    let database_url = format!("sqlite://{}", database_path.to_string_lossy());

    let options = SqliteConnectOptions::from_str(&database_url)?
        .create_if_missing(true)
        .foreign_keys(true);

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect_with(options)
        .await?;

    sqlx::migrate!("./migrations").run(&pool).await?;
    sqlx::query("PRAGMA foreign_keys = ON")
        .execute(&pool)
        .await?;
    seed_default_categories(&pool).await?;

    Ok(pool)
}

async fn seed_default_categories(pool: &SqlitePool) -> Result<(), AppError> {
    for name in ["Recurring Bills", "Saving Contribution"] {
        let now = Utc::now().to_rfc3339();

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
            SELECT ?, ?, ?, ?, ?, ?, ?, ?
            WHERE NOT EXISTS (
                SELECT 1
                FROM categories
                WHERE name = ?
            )
            "#,
        )
        .bind(Uuid::new_v4().to_string())
        .bind(name)
        .bind("expense")
        .bind(Option::<String>::None)
        .bind(Option::<String>::None)
        .bind(false)
        .bind(&now)
        .bind(&now)
        .bind(name)
        .execute(pool)
        .await?;
    }

    Ok(())
}
