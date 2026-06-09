mod commands;
mod database;
mod domain;
mod errors;
mod repositories;
mod state;

use state::app_state::AppState;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let pool = tauri::async_runtime::block_on(database::connection::initialize_database(
                app.handle(),
            ))?;

            app.manage(AppState::new(pool));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::accounts::create_account,
            commands::accounts::list_accounts,
            commands::categories::create_category,
            commands::categories::list_categories,
            commands::transactions::create_transaction,
            commands::transactions::list_transactions
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
