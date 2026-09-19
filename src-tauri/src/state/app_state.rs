use std::path::PathBuf;

use sqlx::SqlitePool;

use crate::errors::app_error::AppError;
use crate::services::security::dto::SecurityStatus;
use crate::services::security::storage::StorageManager;

pub struct AppState {
    pub storage: StorageManager,
}

impl AppState {
    pub fn new(pool: SqlitePool) -> Self {
        Self {
            storage: StorageManager::unlocked_for_tests(pool),
        }
    }

    pub fn locked(app_data_dir: PathBuf) -> Self {
        Self {
            storage: StorageManager::locked(app_data_dir),
        }
    }

    pub async fn db(&self) -> Result<SqlitePool, AppError> {
        self.storage.pool().await
    }

    pub async fn persist(&self) -> Result<(), AppError> {
        self.storage.persist().await
    }

    pub async fn security_status(&self) -> SecurityStatus {
        self.storage.status().await
    }
}
