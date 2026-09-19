use std::{
    env,
    path::{Path, PathBuf},
    str::FromStr,
};

use chrono::Utc;
use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
use sqlx::SqlitePool;
use tauri::{AppHandle, Manager};
use uuid::Uuid;

use crate::errors::app_error::AppError;

pub async fn initialize_runtime_database() -> Result<SqlitePool, AppError> {
    let options = SqliteConnectOptions::from_str("sqlite::memory:")?.foreign_keys(true);
    initialize_pool(options).await
}

pub async fn initialize_database_at_path(path: &Path) -> Result<SqlitePool, AppError> {
    if let Some(parent) = path.parent() {
        tokio::fs::create_dir_all(parent).await?;
    }

    let database_url = format!("sqlite://{}", path.to_string_lossy());
    let options = SqliteConnectOptions::from_str(&database_url)?
        .create_if_missing(true)
        .foreign_keys(true);

    initialize_pool(options).await
}

pub fn app_data_dir(app_handle: &AppHandle) -> Result<PathBuf, AppError> {
    if env::var("WALLET_TEST_MODE").as_deref() == Ok("true") {
        return Ok(env::var_os("WALLET_TEST_DATA_DIR")
            .map(PathBuf::from)
            .unwrap_or_else(|| env::temp_dir().join("wallet-e2e-test")));
    }

    Ok(app_handle.path().app_data_dir()?)
}

async fn initialize_pool(options: SqliteConnectOptions) -> Result<SqlitePool, AppError> {
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
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
