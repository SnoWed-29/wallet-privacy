use serde::Serialize;

use crate::domain::accounts::model::Account;
use crate::domain::budgets::model::Budget;
use crate::domain::categories::model::Category;
use crate::domain::recurring_bills::model::RecurringBill;
use crate::domain::savings_goals::model::SavingsGoal;
use crate::domain::transactions::model::Transaction;

pub const EXPORT_VERSION: &str = "1.0";

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WalletExport {
    pub version: String,
    pub exported_at: String,
    pub accounts: Vec<Account>,
    pub categories: Vec<Category>,
    pub transactions: Vec<Transaction>,
    pub budgets: Vec<Budget>,
    pub recurring_bills: Vec<RecurringBill>,
    pub savings_goals: Vec<SavingsGoal>,
}
