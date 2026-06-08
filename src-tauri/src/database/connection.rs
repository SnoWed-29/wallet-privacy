use std::str::FromStr;

use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
use sqlx::SqlitePool;
use tauri::{AppHandle, Manager};

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

    Ok(pool)
}
