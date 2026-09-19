use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportRequest {
    pub start_date: String,
    pub end_date: String,
    pub account_id: Option<String>,
    pub category_id: Option<String>,
    pub transaction_type: Option<String>,
    pub currency: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportFilters {
    pub start_date: String,
    pub end_date: String,
    pub account_id: Option<String>,
    pub category_id: Option<String>,
    pub transaction_type: Option<String>,
    pub currency: Option<String>,
    pub grouping: String,
    pub day_count: i64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportsSummary {
    pub filters: ReportFilters,
    pub available_currencies: Vec<String>,
    pub has_mixed_currencies: bool,
    pub currency_summaries: Vec<CurrencySummary>,
    pub trend: Vec<TrendPoint>,
    pub expense_categories: Vec<CategoryTotal>,
    pub income_categories: Vec<CategoryTotal>,
    pub period_comparison: Vec<PeriodComparison>,
    pub budget_performance: Vec<BudgetPerformance>,
    pub account_groups: Vec<AccountCurrencyGroup>,
    pub recurring_bills: Vec<RecurringBillStats>,
    pub savings_goals: SavingsGoalStats,
    pub yearly_overview: Option<YearlyOverview>,
    pub matching_transactions: Vec<ReportTransaction>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CurrencySummary {
    pub currency: String,
    pub total_income_minor: i64,
    pub total_expense_minor: i64,
    pub net_cash_flow_minor: i64,
    pub savings_rate_percent: f64,
    pub average_daily_spending_minor: i64,
    pub transaction_count: i64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TrendPoint {
    pub currency: String,
    pub period_start: String,
    pub period_label: String,
    pub income_minor: i64,
    pub expense_minor: i64,
    pub net_cash_flow_minor: i64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CategoryTotal {
    pub currency: String,
    pub category_id: String,
    pub category_name: String,
    pub total_minor: i64,
    pub percentage: f64,
    pub transaction_count: i64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PeriodComparison {
    pub currency: String,
    pub income: ComparisonMetric,
    pub expenses: ComparisonMetric,
    pub net_cash_flow: ComparisonMetric,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ComparisonMetric {
    pub current_minor: i64,
    pub previous_minor: i64,
    pub change_minor: i64,
    pub change_percent: Option<f64>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BudgetPerformance {
    pub id: String,
    pub name: String,
    pub category_id: String,
    pub category_name: String,
    pub currency: String,
    pub limit_minor: i64,
    pub spent_minor: i64,
    pub remaining_minor: i64,
    pub percentage_used: f64,
    pub over_budget_minor: i64,
    pub status: String,
    pub month: i64,
    pub year: i64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountCurrencyGroup {
    pub currency: String,
    pub total_balance_minor: i64,
    pub accounts: Vec<AccountStatistic>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountStatistic {
    pub id: String,
    pub name: String,
    pub account_type: String,
    pub currency: String,
    pub balance_minor: i64,
    pub percentage_of_currency_total: Option<f64>,
    pub is_archived: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RecurringBillStats {
    pub currency: String,
    pub expected_bills: i64,
    pub paid_bills: i64,
    pub unpaid_bills: i64,
    pub expected_amount_minor: i64,
    pub paid_amount_minor: i64,
    pub upcoming_amount_minor: i64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SavingsGoalStats {
    pub active_goals: i64,
    pub completed_goals: i64,
    pub total_targets_minor: i64,
    pub recorded_contributions: Vec<ContributionCurrencyTotal>,
    pub overall_progress_percent: f64,
    pub contribution_history: Vec<SavingsContributionPoint>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ContributionCurrencyTotal {
    pub currency: String,
    pub amount_minor: i64,
    pub transaction_count: i64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SavingsContributionPoint {
    pub currency: String,
    pub date: String,
    pub amount_minor: i64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct YearlyOverview {
    pub year: i64,
    pub currency_summaries: Vec<YearlyCurrencyOverview>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct YearlyCurrencyOverview {
    pub currency: String,
    pub months: Vec<YearMonthPoint>,
    pub annual_income_minor: i64,
    pub annual_expense_minor: i64,
    pub annual_net_cash_flow_minor: i64,
    pub average_monthly_income_minor: i64,
    pub average_monthly_expense_minor: i64,
    pub highest_expense_month: Option<String>,
    pub best_net_cash_flow_month: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct YearMonthPoint {
    pub month: i64,
    pub label: String,
    pub income_minor: i64,
    pub expense_minor: i64,
    pub net_cash_flow_minor: i64,
}

#[derive(Debug, Clone, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ReportTransaction {
    pub id: String,
    pub account_id: String,
    pub account_name: String,
    pub account_type: String,
    pub currency: String,
    pub category_id: String,
    pub category_name: String,
    pub category_type: String,
    pub transaction_type: String,
    pub amount_minor: i64,
    pub description: Option<String>,
    pub transaction_date: String,
}

#[derive(Debug, Clone, FromRow)]
pub struct ReportAccountRow {
    pub id: String,
    pub name: String,
    pub account_type: String,
    pub currency: String,
    pub balance_minor: i64,
    pub is_archived: bool,
}

#[derive(Debug, Clone, FromRow)]
pub struct ReportBudgetRow {
    pub id: String,
    pub name: String,
    pub category_id: String,
    pub category_name: String,
    pub amount_minor: i64,
    pub month: i64,
    pub year: i64,
}

#[derive(Debug, Clone, FromRow)]
pub struct ReportRecurringBillRow {
    pub id: String,
    pub name: String,
    pub currency: String,
    pub amount_minor: i64,
    pub next_due_date: String,
    pub last_paid_date: Option<String>,
}

#[derive(Debug, Clone, FromRow)]
pub struct ReportSavingsGoalRow {
    pub id: String,
    pub name: String,
    pub target_amount_minor: i64,
    pub current_amount_minor: i64,
    pub is_archived: bool,
}
