pub mod commands;
pub mod database;
pub mod domain;
pub mod errors;
pub mod repositories;
pub mod services;
pub mod state;

use state::app_state::AppState;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_data_dir = database::connection::app_data_dir(app.handle())?;
            app.manage(AppState::locked(app_data_dir));
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.maximize();
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::security::get_security_status,
            commands::security::setup_app_password,
            commands::security::unlock_wallet,
            commands::security::lock_wallet,
            commands::accounts::create_account,
            commands::accounts::update_account,
            commands::accounts::archive_account,
            commands::accounts::list_accounts,
            commands::budgets::create_budget,
            commands::budgets::list_budgets,
            commands::budgets::update_budget,
            commands::budgets::archive_budget,
            commands::categories::create_category,
            commands::categories::update_category,
            commands::categories::archive_category,
            commands::categories::list_categories,
            commands::dashboard::get_dashboard_summary,
            commands::backup::create_wallet_backup,
            commands::backup::validate_backup_file,
            commands::backup::restore_wallet_backup,
            commands::export::export_wallet_data,
            commands::r#import::validate_import_file,
            commands::r#import::import_wallet_data,
            commands::recurring_bills::create_recurring_bill,
            commands::recurring_bills::list_recurring_bills,
            commands::recurring_bills::update_recurring_bill,
            commands::recurring_bills::archive_recurring_bill,
            commands::recurring_bills::mark_recurring_bill_paid,
            commands::reports::get_reports_summary,
            commands::savings_goals::create_savings_goal,
            commands::savings_goals::list_savings_goals,
            commands::savings_goals::update_savings_goal,
            commands::savings_goals::archive_savings_goal,
            commands::savings_goals::contribute_to_savings_goal,
            commands::transactions::create_transaction,
            commands::transactions::update_transaction,
            commands::transactions::delete_transaction,
            commands::transactions::list_transactions,
            commands::transactions::filter_transactions
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
