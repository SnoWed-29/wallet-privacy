use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WalletImport {
    pub version: String,
    pub exported_at: String,
    pub accounts: Vec<ImportAccount>,
    pub categories: Vec<ImportCategory>,
    pub transactions: Vec<ImportTransaction>,
    pub budgets: Vec<ImportBudget>,
    pub recurring_bills: Vec<ImportRecurringBill>,
    pub savings_goals: Vec<ImportSavingsGoal>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportAccount {
    pub id: String,
    pub name: String,
    pub account_type: String,
    pub currency: String,
    pub initial_balance_minor: i64,
    pub is_archived: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportCategory {
    pub id: String,
    pub name: String,
    pub category_type: String,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub is_archived: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportTransaction {
    pub id: String,
    pub account_id: String,
    pub category_id: String,
    pub transaction_type: String,
    pub amount_minor: i64,
    pub description: Option<String>,
    pub transaction_date: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportBudget {
    pub id: String,
    pub name: String,
    pub category_id: String,
    pub amount_minor: i64,
    pub month: i64,
    pub year: i64,
    pub is_archived: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportRecurringBill {
    pub id: String,
    pub name: String,
    pub account_id: String,
    pub category_id: String,
    pub amount_minor: i64,
    pub frequency: String,
    pub next_due_date: String,
    pub last_paid_date: Option<String>,
    pub description: Option<String>,
    pub is_archived: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportSavingsGoal {
    pub id: String,
    pub name: String,
    pub target_amount_minor: i64,
    pub current_amount_minor: i64,
    pub deadline_date: Option<String>,
    pub is_archived: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportSummary {
    pub version: String,
    pub exported_at: String,
    pub accounts: usize,
    pub categories: usize,
    pub transactions: usize,
    pub budgets: usize,
    pub recurring_bills: usize,
    pub savings_goals: usize,
}

#[derive(Debug, Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportEntityCounts {
    pub accounts: u64,
    pub categories: u64,
    pub transactions: u64,
    pub budgets: u64,
    pub recurring_bills: u64,
    pub savings_goals: u64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportResult {
    pub summary: ImportSummary,
    pub imported: ImportEntityCounts,
    pub skipped: ImportEntityCounts,
}

impl WalletImport {
    pub fn summary(&self) -> ImportSummary {
        ImportSummary {
            version: self.version.clone(),
            exported_at: self.exported_at.clone(),
            accounts: self.accounts.len(),
            categories: self.categories.len(),
            transactions: self.transactions.len(),
            budgets: self.budgets.len(),
            recurring_bills: self.recurring_bills.len(),
            savings_goals: self.savings_goals.len(),
        }
    }
}
