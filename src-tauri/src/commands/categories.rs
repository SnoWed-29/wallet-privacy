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
    let db = state.db().await?;
    let category = CategoryService::create(&db, request).await?;
    state.persist().await?;
    Ok(category)
}

#[tauri::command]
pub async fn list_categories(state: State<'_, AppState>) -> Result<Vec<Category>, AppError> {
    let db = state.db().await?;
    CategoryService::list(&db).await
}

#[tauri::command]
pub async fn update_category(
    state: State<'_, AppState>,
    request: UpdateCategoryRequest,
) -> Result<Category, AppError> {
    let db = state.db().await?;
    let category = CategoryService::update(&db, request).await?;
    state.persist().await?;
    Ok(category)
}

#[tauri::command]
pub async fn archive_category(
    state: State<'_, AppState>,
    request: ArchiveCategoryRequest,
) -> Result<(), AppError> {
    let db = state.db().await?;
    CategoryService::archive(&db, request).await?;
    state.persist().await?;
    Ok(())
}
