use serde::Serialize;
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DashboardSummary {
    pub total_balance_minor: i64,
    pub monthly_income_minor: i64,
    pub monthly_expense_minor: i64,
    pub monthly_net_minor: i64,
    pub accounts: Vec<DashboardAccount>,
    pub recent_transactions: Vec<DashboardRecentTransaction>,
    pub active_budgets: Vec<DashboardBudget>,
    pub upcoming_recurring_bills: Vec<DashboardRecurringBill>,
    pub active_savings_goals: Vec<DashboardSavingsGoal>,
}

#[derive(Debug, Clone, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct DashboardAccount {
    pub id: String,
    pub name: String,
    pub balance_minor: i64,
}

#[derive(Debug, Clone, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct DashboardRecentTransaction {
    pub amount_minor: i64,
    pub transaction_type: String,
    pub category_name: String,
    pub account_name: String,
    pub description: Option<String>,
    pub transaction_date: String,
}

#[derive(Debug, Clone, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct DashboardBudget {
    pub name: String,
    pub category_name: String,
    pub amount_minor: i64,
    pub spent_minor: i64,
    pub remaining_minor: i64,
    pub progress_percentage: f64,
    pub is_near_limit: bool,
    pub is_exceeded: bool,
}

#[derive(Debug, Clone, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct DashboardRecurringBill {
    pub name: String,
    pub amount_minor: i64,
    pub next_due_date: String,
    pub days_remaining: i64,
}

#[derive(Debug, Clone, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct DashboardSavingsGoal {
    pub name: String,
    pub target_amount_minor: i64,
    pub current_amount_minor: i64,
    pub remaining_amount_minor: i64,
    pub progress_percent: i64,
}
