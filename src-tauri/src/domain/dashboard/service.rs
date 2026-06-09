use chrono::{Datelike, Months, NaiveDate, Utc};
use sqlx::SqlitePool;

use crate::domain::dashboard::dto::DashboardSummary;
use crate::errors::app_error::AppError;
use crate::repositories::dashboard_repository::DashboardRepository;

pub struct DashboardService;

impl DashboardService {
    pub async fn get_summary(pool: &SqlitePool) -> Result<DashboardSummary, AppError> {
        let today = Utc::now().date_naive();
        let month_start =
            NaiveDate::from_ymd_opt(today.year(), today.month(), 1).ok_or_else(|| {
                AppError::Validation("Could not determine current month.".to_string())
            })?;
        let next_month_start = month_start
            .checked_add_months(Months::new(1))
            .ok_or_else(|| AppError::Validation("Could not determine next month.".to_string()))?;
        let upcoming_end = today
            .checked_add_days(chrono::Days::new(14))
            .ok_or_else(|| {
                AppError::Validation("Could not determine upcoming bills range.".to_string())
            })?;

        let accounts = DashboardRepository::accounts(pool).await?;
        let total_balance_minor = accounts
            .iter()
            .map(|account| account.balance_minor)
            .sum::<i64>();

        let monthly_income_minor = DashboardRepository::monthly_total(
            pool,
            "income",
            &month_start.to_string(),
            &next_month_start.to_string(),
        )
        .await?;
        let monthly_expense_minor = DashboardRepository::monthly_total(
            pool,
            "expense",
            &month_start.to_string(),
            &next_month_start.to_string(),
        )
        .await?;

        Ok(DashboardSummary {
            total_balance_minor,
            monthly_income_minor,
            monthly_expense_minor,
            monthly_net_minor: monthly_income_minor - monthly_expense_minor,
            accounts,
            recent_transactions: DashboardRepository::recent_transactions(pool).await?,
            active_budgets: DashboardRepository::active_budgets(pool).await?,
            upcoming_recurring_bills: DashboardRepository::upcoming_recurring_bills(
                pool,
                &today.to_string(),
                &upcoming_end.to_string(),
            )
            .await?,
            active_savings_goals: DashboardRepository::active_savings_goals(pool).await?,
        })
    }
}
