use tauri::State;

use crate::domain::categories::dto::{
    ArchiveCategoryRequest, CreateCategoryRequest, UpdateCategoryRequest,
};
use crate::domain::categories::model::Category;
use crate::domain::categories::service::CategoryService;
use crate::errors::app_error::AppError;
use crate::state::app_state::AppState;

#[tauri::command]
pub async fn create_category(
    state: State<'_, AppState>,
    request: CreateCategoryRequest,
) -> Result<Category, AppError> {
    CategoryService::create(&state.db, request).await
}

#[tauri::command]
pub async fn list_categories(state: State<'_, AppState>) -> Result<Vec<Category>, AppError> {
    CategoryService::list(&state.db).await
}

#[tauri::command]
pub async fn update_category(
    state: State<'_, AppState>,
    request: UpdateCategoryRequest,
) -> Result<Category, AppError> {
    CategoryService::update(&state.db, request).await
}

#[tauri::command]
pub async fn archive_category(
    state: State<'_, AppState>,
    request: ArchiveCategoryRequest,
) -> Result<(), AppError> {
    CategoryService::archive(&state.db, request).await
}
