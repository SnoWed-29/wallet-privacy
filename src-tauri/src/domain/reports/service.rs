use std::collections::{BTreeMap, BTreeSet, HashMap};

use chrono::{Datelike, Days, Months, NaiveDate};
use sqlx::SqlitePool;

use crate::domain::reports::dto::{
    AccountCurrencyGroup, AccountStatistic, BudgetPerformance, CategoryTotal, ComparisonMetric,
    ContributionCurrencyTotal, CurrencySummary, PeriodComparison, RecurringBillStats,
    ReportAccountRow, ReportBudgetRow, ReportFilters, ReportRecurringBillRow, ReportRequest,
    ReportSavingsGoalRow, ReportTransaction, ReportsSummary, SavingsContributionPoint,
    SavingsGoalStats, TrendPoint, YearMonthPoint, YearlyCurrencyOverview, YearlyOverview,
};
use crate::errors::app_error::AppError;
use crate::repositories::report_repository::ReportRepository;

const SAVING_CONTRIBUTION_CATEGORY_NAME: &str = "Saving Contribution";
const DEFAULT_CURRENCY: &str = "MAD";

pub struct ReportService;

impl ReportService {
    pub async fn summary(
        pool: &SqlitePool,
        request: ReportRequest,
    ) -> Result<ReportsSummary, AppError> {
        let request = normalize_request(request)?;
        let start = parse_date(&request.start_date, "Start date")?;
        let end = parse_date(&request.end_date, "End date")?;
        if start > end {
            return Err(AppError::Validation(
                "Start date cannot be after end date.".to_string(),
            ));
        }

        let day_count = end.signed_duration_since(start).num_days() + 1;
        let grouping = grouping_for_days(day_count);
        let previous_end = start.checked_sub_days(Days::new(1)).ok_or_else(|| {
            AppError::Validation("Could not calculate comparison period.".to_string())
        })?;
        let previous_start = previous_end
            .checked_sub_days(Days::new((day_count - 1) as u64))
            .ok_or_else(|| {
                AppError::Validation("Could not calculate comparison period.".to_string())
            })?;

        let transactions = ReportRepository::matching_transactions(pool, &request).await?;
        let previous_transactions = ReportRepository::previous_period_transactions(
            pool,
            &request,
            &previous_start.to_string(),
            &previous_end.to_string(),
        )
        .await?;
        let accounts = ReportRepository::accounts(pool, &request).await?;
        let budgets = ReportRepository::budgets(pool, &request).await?;
        let recurring_bills = ReportRepository::recurring_bills(pool, &request).await?;
        let savings_goals = ReportRepository::savings_goals(pool).await?;
        let available_currencies = ReportRepository::currencies(pool).await?;

        let currency_summaries = currency_summaries(&transactions, day_count);
        let trend = trend_points(&transactions, start, end, grouping);
        let expense_categories = category_totals(&transactions, "expense");
        let income_categories = category_totals(&transactions, "income");
        let period_comparison = period_comparison(&transactions, &previous_transactions);
        let budget_performance = budget_performance(&budgets, &transactions, &request);
        let account_groups = account_groups(&accounts);
        let recurring_bills = recurring_bill_stats(&recurring_bills, start, end);
        let savings_goals = savings_goal_stats(&savings_goals, &transactions);
        let yearly_overview = yearly_overview(&transactions, start, end);

        Ok(ReportsSummary {
            filters: ReportFilters {
                start_date: request.start_date,
                end_date: request.end_date,
                account_id: request.account_id,
                category_id: request.category_id,
                transaction_type: request.transaction_type,
                currency: request.currency,
                grouping: grouping.to_string(),
                day_count,
            },
            available_currencies,
            has_mixed_currencies: has_mixed_currencies(&transactions),
            currency_summaries,
            trend,
            expense_categories,
            income_categories,
            period_comparison,
            budget_performance,
            account_groups,
            recurring_bills,
            savings_goals,
            yearly_overview,
            matching_transactions: transactions,
        })
    }
}

fn normalize_request(mut request: ReportRequest) -> Result<ReportRequest, AppError> {
    request.start_date = request.start_date.trim().to_string();
    request.end_date = request.end_date.trim().to_string();

    if request.start_date.is_empty() {
        return Err(AppError::Validation("Start date is required.".to_string()));
    }
    if request.end_date.is_empty() {
        return Err(AppError::Validation("End date is required.".to_string()));
    }

    request.account_id = optional_trim(request.account_id);
    request.category_id = optional_trim(request.category_id);
    request.currency = optional_trim(request.currency).map(|currency| currency.to_uppercase());
    request.transaction_type = optional_trim(request.transaction_type)
        .map(|transaction_type| transaction_type.to_lowercase());

    if let Some(transaction_type) = &request.transaction_type {
        if transaction_type != "income" && transaction_type != "expense" {
            return Err(AppError::Validation(
                "Transaction type must be income or expense.".to_string(),
            ));
        }
    }

    Ok(request)
}

fn optional_trim(value: Option<String>) -> Option<String> {
    value
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
}

fn parse_date(value: &str, label: &str) -> Result<NaiveDate, AppError> {
    NaiveDate::parse_from_str(value, "%Y-%m-%d")
        .map_err(|_| AppError::Validation(format!("{label} must use YYYY-MM-DD format.")))
}

fn grouping_for_days(day_count: i64) -> &'static str {
    if day_count <= 31 {
        "daily"
    } else if day_count <= 180 {
        "weekly"
    } else {
        "monthly"
    }
}

fn currency_summaries(transactions: &[ReportTransaction], day_count: i64) -> Vec<CurrencySummary> {
    let mut buckets = BTreeMap::<String, (i64, i64, i64)>::new();

    for transaction in transactions {
        let entry = buckets
            .entry(transaction.currency.clone())
            .or_insert((0, 0, 0));
        match transaction.transaction_type.as_str() {
            "income" => entry.0 += transaction.amount_minor,
            "expense" => entry.1 += transaction.amount_minor,
            _ => {}
        }
        entry.2 += 1;
    }

    buckets
        .into_iter()
        .map(|(currency, (income, expenses, count))| CurrencySummary {
            currency,
            total_income_minor: income,
            total_expense_minor: expenses,
            net_cash_flow_minor: income - expenses,
            savings_rate_percent: safe_percent(income - expenses, income),
            average_daily_spending_minor: if day_count > 0 {
                expenses / day_count
            } else {
                0
            },
            transaction_count: count,
        })
        .collect()
}

fn trend_points(
    transactions: &[ReportTransaction],
    start: NaiveDate,
    end: NaiveDate,
    grouping: &str,
) -> Vec<TrendPoint> {
    let currencies = currencies_for_transactions(transactions);
    let mut buckets = BTreeMap::<(String, String), (i64, i64)>::new();

    for date in period_starts(start, end, grouping) {
        for currency in &currencies {
            buckets.insert((currency.clone(), date.to_string()), (0, 0));
        }
    }

    for transaction in transactions {
        if let Ok(date) = NaiveDate::parse_from_str(&transaction.transaction_date, "%Y-%m-%d") {
            let period_start = period_start_for(date, grouping).to_string();
            let entry = buckets
                .entry((transaction.currency.clone(), period_start))
                .or_insert((0, 0));
            match transaction.transaction_type.as_str() {
                "income" => entry.0 += transaction.amount_minor,
                "expense" => entry.1 += transaction.amount_minor,
                _ => {}
            }
        }
    }

    buckets
        .into_iter()
        .map(
            |((currency, period_start), (income, expenses))| TrendPoint {
                currency,
                period_label: trend_label(&period_start, grouping),
                period_start,
                income_minor: income,
                expense_minor: expenses,
                net_cash_flow_minor: income - expenses,
            },
        )
        .collect()
}

fn currencies_for_transactions(transactions: &[ReportTransaction]) -> Vec<String> {
    let currencies = transactions
        .iter()
        .map(|transaction| transaction.currency.clone())
        .collect::<BTreeSet<_>>();

    if currencies.is_empty() {
        vec![DEFAULT_CURRENCY.to_string()]
    } else {
        currencies.into_iter().collect()
    }
}

fn period_starts(start: NaiveDate, end: NaiveDate, grouping: &str) -> Vec<NaiveDate> {
    let mut dates = Vec::new();
    let mut current = period_start_for(start, grouping);

    while current <= end {
        dates.push(current);
        current = match grouping {
            "daily" => current.checked_add_days(Days::new(1)),
            "weekly" => current.checked_add_days(Days::new(7)),
            _ => current.checked_add_months(Months::new(1)),
        }
        .unwrap_or(end + Days::new(1));
    }

    dates
}

fn period_start_for(date: NaiveDate, grouping: &str) -> NaiveDate {
    match grouping {
        "daily" => date,
        "weekly" => date
            .checked_sub_days(Days::new(date.weekday().num_days_from_monday() as u64))
            .unwrap_or(date),
        _ => NaiveDate::from_ymd_opt(date.year(), date.month(), 1).unwrap_or(date),
    }
}

fn trend_label(period_start: &str, grouping: &str) -> String {
    let Ok(date) = NaiveDate::parse_from_str(period_start, "%Y-%m-%d") else {
        return period_start.to_string();
    };

    match grouping {
        "daily" => date.format("%b %d").to_string(),
        "weekly" => format!("Week of {}", date.format("%b %d")),
        _ => date.format("%b %Y").to_string(),
    }
}

fn category_totals(
    transactions: &[ReportTransaction],
    transaction_type: &str,
) -> Vec<CategoryTotal> {
    let mut totals = BTreeMap::<(String, String, String), (i64, i64)>::new();
    let mut currency_totals = HashMap::<String, i64>::new();

    for transaction in transactions
        .iter()
        .filter(|transaction| transaction.transaction_type == transaction_type)
    {
        *currency_totals
            .entry(transaction.currency.clone())
            .or_insert(0) += transaction.amount_minor;
        let entry = totals
            .entry((
                transaction.currency.clone(),
                transaction.category_id.clone(),
                transaction.category_name.clone(),
            ))
            .or_insert((0, 0));
        entry.0 += transaction.amount_minor;
        entry.1 += 1;
    }

    let mut rows = totals
        .into_iter()
        .map(
            |((currency, category_id, category_name), (total_minor, count))| CategoryTotal {
                percentage: safe_percent(
                    total_minor,
                    *currency_totals.get(&currency).unwrap_or(&0),
                ),
                currency,
                category_id,
                category_name,
                total_minor,
                transaction_count: count,
            },
        )
        .collect::<Vec<_>>();

    rows.sort_by(|a, b| {
        a.currency
            .cmp(&b.currency)
            .then_with(|| b.total_minor.cmp(&a.total_minor))
            .then_with(|| a.category_name.cmp(&b.category_name))
    });
    rows
}

fn period_comparison(
    current: &[ReportTransaction],
    previous: &[ReportTransaction],
) -> Vec<PeriodComparison> {
    let mut currencies = BTreeSet::new();
    currencies.extend(
        current
            .iter()
            .map(|transaction| transaction.currency.clone()),
    );
    currencies.extend(
        previous
            .iter()
            .map(|transaction| transaction.currency.clone()),
    );

    currencies
        .into_iter()
        .map(|currency| {
            let (current_income, current_expenses) = totals_for_currency(current, &currency);
            let (previous_income, previous_expenses) = totals_for_currency(previous, &currency);
            PeriodComparison {
                currency,
                income: comparison_metric(current_income, previous_income),
                expenses: comparison_metric(current_expenses, previous_expenses),
                net_cash_flow: comparison_metric(
                    current_income - current_expenses,
                    previous_income - previous_expenses,
                ),
            }
        })
        .collect()
}

fn totals_for_currency(transactions: &[ReportTransaction], currency: &str) -> (i64, i64) {
    transactions
        .iter()
        .filter(|transaction| transaction.currency == currency)
        .fold(
            (0, 0),
            |(income, expenses), transaction| match transaction.transaction_type.as_str() {
                "income" => (income + transaction.amount_minor, expenses),
                "expense" => (income, expenses + transaction.amount_minor),
                _ => (income, expenses),
            },
        )
}

fn comparison_metric(current: i64, previous: i64) -> ComparisonMetric {
    ComparisonMetric {
        current_minor: current,
        previous_minor: previous,
        change_minor: current - previous,
        change_percent: if previous == 0 {
            None
        } else {
            Some(safe_percent(current - previous, previous.abs()))
        },
    }
}

fn budget_performance(
    budgets: &[ReportBudgetRow],
    transactions: &[ReportTransaction],
    request: &ReportRequest,
) -> Vec<BudgetPerformance> {
    let mut rows = Vec::new();

    for budget in budgets {
        let mut spent_by_currency = BTreeMap::<String, i64>::new();
        for transaction in transactions.iter().filter(|transaction| {
            transaction.transaction_type == "expense"
                && transaction.category_id == budget.category_id
        }) {
            if transaction_in_budget_month(transaction, budget) {
                *spent_by_currency
                    .entry(transaction.currency.clone())
                    .or_insert(0) += transaction.amount_minor;
            }
        }

        if spent_by_currency.is_empty() {
            spent_by_currency.insert(
                request
                    .currency
                    .clone()
                    .unwrap_or_else(|| DEFAULT_CURRENCY.to_string()),
                0,
            );
        }

        for (currency, spent_minor) in spent_by_currency {
            let remaining_minor = budget.amount_minor - spent_minor;
            let percentage_used = safe_percent(spent_minor, budget.amount_minor);
            let over_budget_minor = (spent_minor - budget.amount_minor).max(0);
            let status = if over_budget_minor > 0 {
                "Over budget"
            } else if percentage_used >= 80.0 {
                "Approaching limit"
            } else {
                "On track"
            };

            rows.push(BudgetPerformance {
                id: budget.id.clone(),
                name: budget.name.clone(),
                category_id: budget.category_id.clone(),
                category_name: budget.category_name.clone(),
                currency,
                limit_minor: budget.amount_minor,
                spent_minor,
                remaining_minor,
                percentage_used,
                over_budget_minor,
                status: status.to_string(),
                month: budget.month,
                year: budget.year,
            });
        }
    }

    rows
}

fn transaction_in_budget_month(transaction: &ReportTransaction, budget: &ReportBudgetRow) -> bool {
    let Ok(date) = NaiveDate::parse_from_str(&transaction.transaction_date, "%Y-%m-%d") else {
        return false;
    };

    i64::from(date.month()) == budget.month && i64::from(date.year()) == budget.year
}

fn account_groups(accounts: &[ReportAccountRow]) -> Vec<AccountCurrencyGroup> {
    let mut buckets = BTreeMap::<String, Vec<AccountStatistic>>::new();

    for account in accounts {
        buckets
            .entry(account.currency.clone())
            .or_default()
            .push(AccountStatistic {
                id: account.id.clone(),
                name: account.name.clone(),
                account_type: account.account_type.clone(),
                currency: account.currency.clone(),
                balance_minor: account.balance_minor,
                percentage_of_currency_total: None,
                is_archived: account.is_archived,
            });
    }

    buckets
        .into_iter()
        .map(|(currency, mut accounts)| {
            let total_balance_minor = accounts
                .iter()
                .map(|account| account.balance_minor)
                .sum::<i64>();
            for account in &mut accounts {
                account.percentage_of_currency_total = if total_balance_minor > 0 {
                    Some(safe_percent(account.balance_minor, total_balance_minor))
                } else {
                    None
                };
            }

            AccountCurrencyGroup {
                currency,
                total_balance_minor,
                accounts,
            }
        })
        .collect()
}

fn recurring_bill_stats(
    bills: &[ReportRecurringBillRow],
    start: NaiveDate,
    end: NaiveDate,
) -> Vec<RecurringBillStats> {
    let mut buckets = BTreeMap::<String, RecurringBillStats>::new();

    for bill in bills {
        let entry = buckets
            .entry(bill.currency.clone())
            .or_insert(RecurringBillStats {
                currency: bill.currency.clone(),
                expected_bills: 0,
                paid_bills: 0,
                unpaid_bills: 0,
                expected_amount_minor: 0,
                paid_amount_minor: 0,
                upcoming_amount_minor: 0,
            });

        let due_in_period = date_in_range(&bill.next_due_date, start, end);
        let paid_in_period = bill
            .last_paid_date
            .as_deref()
            .is_some_and(|date| date_in_range(date, start, end));

        if due_in_period {
            entry.expected_bills += 1;
            entry.expected_amount_minor += bill.amount_minor;
            if !paid_in_period {
                entry.unpaid_bills += 1;
                entry.upcoming_amount_minor += bill.amount_minor;
            }
        }

        if paid_in_period {
            entry.paid_bills += 1;
            entry.paid_amount_minor += bill.amount_minor;
        }
    }

    buckets.into_values().collect()
}

fn date_in_range(value: &str, start: NaiveDate, end: NaiveDate) -> bool {
    let Ok(date) = NaiveDate::parse_from_str(value, "%Y-%m-%d") else {
        return false;
    };
    date >= start && date <= end
}

fn savings_goal_stats(
    goals: &[ReportSavingsGoalRow],
    transactions: &[ReportTransaction],
) -> SavingsGoalStats {
    let active_goals = goals.iter().filter(|goal| !goal.is_archived).count() as i64;
    let completed_goals = goals
        .iter()
        .filter(|goal| goal.current_amount_minor >= goal.target_amount_minor)
        .count() as i64;
    let total_targets_minor = goals
        .iter()
        .filter(|goal| !goal.is_archived)
        .map(|goal| goal.target_amount_minor)
        .sum::<i64>();
    let total_current_minor = goals
        .iter()
        .filter(|goal| !goal.is_archived)
        .map(|goal| goal.current_amount_minor)
        .sum::<i64>();

    let mut contribution_totals = BTreeMap::<String, (i64, i64)>::new();
    let mut contribution_history = Vec::new();

    for transaction in transactions.iter().filter(|transaction| {
        transaction.transaction_type == "expense"
            && transaction.category_name == SAVING_CONTRIBUTION_CATEGORY_NAME
    }) {
        let entry = contribution_totals
            .entry(transaction.currency.clone())
            .or_insert((0, 0));
        entry.0 += transaction.amount_minor;
        entry.1 += 1;
        contribution_history.push(SavingsContributionPoint {
            currency: transaction.currency.clone(),
            date: transaction.transaction_date.clone(),
            amount_minor: transaction.amount_minor,
        });
    }

    SavingsGoalStats {
        active_goals,
        completed_goals,
        total_targets_minor,
        recorded_contributions: contribution_totals
            .into_iter()
            .map(
                |(currency, (amount_minor, transaction_count))| ContributionCurrencyTotal {
                    currency,
                    amount_minor,
                    transaction_count,
                },
            )
            .collect(),
        overall_progress_percent: safe_percent(total_current_minor, total_targets_minor),
        contribution_history,
    }
}

fn yearly_overview(
    transactions: &[ReportTransaction],
    start: NaiveDate,
    end: NaiveDate,
) -> Option<YearlyOverview> {
    if start.month() != 1
        || start.day() != 1
        || end.month() != 12
        || end.day() != 31
        || start.year() != end.year()
    {
        return None;
    }

    let year = i64::from(start.year());
    let currencies = currencies_for_transactions(transactions);

    let currency_summaries = currencies
        .into_iter()
        .map(|currency| {
            let mut months = (1..=12)
                .map(|month| YearMonthPoint {
                    month,
                    label: NaiveDate::from_ymd_opt(start.year(), month as u32, 1)
                        .map(|date| date.format("%b").to_string())
                        .unwrap_or_else(|| month.to_string()),
                    income_minor: 0,
                    expense_minor: 0,
                    net_cash_flow_minor: 0,
                })
                .collect::<Vec<_>>();

            for transaction in transactions
                .iter()
                .filter(|transaction| transaction.currency == currency)
            {
                let Ok(date) = NaiveDate::parse_from_str(&transaction.transaction_date, "%Y-%m-%d")
                else {
                    continue;
                };
                let point = &mut months[(date.month() - 1) as usize];
                match transaction.transaction_type.as_str() {
                    "income" => point.income_minor += transaction.amount_minor,
                    "expense" => point.expense_minor += transaction.amount_minor,
                    _ => {}
                }
                point.net_cash_flow_minor = point.income_minor - point.expense_minor;
            }

            let annual_income_minor = months.iter().map(|month| month.income_minor).sum::<i64>();
            let annual_expense_minor = months.iter().map(|month| month.expense_minor).sum::<i64>();
            let annual_net_cash_flow_minor = annual_income_minor - annual_expense_minor;
            let highest_expense_month = months
                .iter()
                .max_by_key(|month| month.expense_minor)
                .filter(|month| month.expense_minor > 0)
                .map(|month| month.label.clone());
            let best_net_cash_flow_month = months
                .iter()
                .max_by_key(|month| month.net_cash_flow_minor)
                .filter(|month| month.net_cash_flow_minor != 0)
                .map(|month| month.label.clone());

            YearlyCurrencyOverview {
                currency,
                months,
                annual_income_minor,
                annual_expense_minor,
                annual_net_cash_flow_minor,
                average_monthly_income_minor: annual_income_minor / 12,
                average_monthly_expense_minor: annual_expense_minor / 12,
                highest_expense_month,
                best_net_cash_flow_month,
            }
        })
        .collect();

    Some(YearlyOverview {
        year,
        currency_summaries,
    })
}

fn has_mixed_currencies(transactions: &[ReportTransaction]) -> bool {
    transactions
        .iter()
        .map(|transaction| transaction.currency.as_str())
        .collect::<BTreeSet<_>>()
        .len()
        > 1
}

fn safe_percent(numerator: i64, denominator: i64) -> f64 {
    if denominator == 0 {
        0.0
    } else {
        (numerator as f64 / denominator as f64) * 100.0
    }
}
