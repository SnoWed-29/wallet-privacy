use std::path::Path;

use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
use sqlx::SqlitePool;
use tempfile::TempDir;

pub struct TestDb {
    pub pool: SqlitePool,
    pub dir: TempDir,
}

impl TestDb {
    pub fn path(&self) -> &Path {
        self.dir.path()
    }

    pub async fn close(self) {
        self.pool.close().await;
    }
}

pub async fn create_test_db() -> TestDb {
    let dir = tempfile::tempdir().expect("create temp test database directory");
    let db_path = dir.path().join("wallet-test.db");
    let options = SqliteConnectOptions::new()
        .filename(&db_path)
        .create_if_missing(true)
        .foreign_keys(true);

    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect_with(options)
        .await
        .expect("connect to isolated test database");

    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("run migrations against isolated test database");

    sqlx::query("PRAGMA foreign_keys = ON")
        .execute(&pool)
        .await
        .expect("enable foreign keys for isolated test database");

    TestDb { pool, dir }
}
