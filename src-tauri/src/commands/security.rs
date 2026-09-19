use tauri::State;

use crate::errors::app_error::AppError;
use crate::services::security::dto::{PasswordRequest, SecurityStatus};
use crate::state::app_state::AppState;

#[tauri::command]
pub async fn get_security_status(state: State<'_, AppState>) -> Result<SecurityStatus, AppError> {
    Ok(state.security_status().await)
}

#[tauri::command]
pub async fn setup_app_password(
    state: State<'_, AppState>,
    request: PasswordRequest,
) -> Result<SecurityStatus, AppError> {
    state.storage.setup_password(request.password).await
}

#[tauri::command]
pub async fn unlock_wallet(
    state: State<'_, AppState>,
    request: PasswordRequest,
) -> Result<SecurityStatus, AppError> {
    state.storage.unlock(request.password).await
}

#[tauri::command]
pub async fn lock_wallet(state: State<'_, AppState>) -> Result<SecurityStatus, AppError> {
    state.storage.lock().await
}
