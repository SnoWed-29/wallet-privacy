use sqlx::{QueryBuilder, Sqlite, SqlitePool};

use crate::domain::reports::dto::{
    ReportAccountRow, ReportBudgetRow, ReportRecurringBillRow, ReportRequest, ReportSavingsGoalRow,
    ReportTransaction,
};
use crate::errors::app_error::AppError;

pub struct ReportRepository;

impl ReportRepository {
    pub async fn matching_transactions(
        pool: &SqlitePool,
        request: &ReportRequest,
    ) -> Result<Vec<ReportTransaction>, AppError> {
        let mut query = QueryBuilder::<Sqlite>::new(
            r#"
            SELECT
                transactions.id,
                transactions.account_id,
                accounts.name AS account_name,
                accounts.account_type,
                accounts.currency,
                transactions.category_id,
                categories.name AS category_name,
                categories.category_type,
                transactions.transaction_type,
                transactions.amount_minor,
                transactions.description,
                transactions.transaction_date
            FROM transactions
            INNER JOIN accounts ON accounts.id = transactions.account_id
            INNER JOIN categories ON categories.id = transactions.category_id
            WHERE transactions.transaction_date >=
            "#,
        );

        query.push_bind(request.start_date.trim().to_string());
        query.push(" AND transactions.transaction_date <= ");
        query.push_bind(request.end_date.trim().to_string());

        push_optional_filter(
            &mut query,
            " AND transactions.account_id = ",
            request.account_id.as_deref(),
        );
        push_optional_filter(
            &mut query,
            " AND transactions.category_id = ",
            request.category_id.as_deref(),
        );
        push_optional_filter(
            &mut query,
            " AND transactions.transaction_type = ",
            request.transaction_type.as_deref(),
        );
        push_optional_filter(
            &mut query,
            " AND accounts.currency = ",
            request.currency.as_deref(),
        );

        query.push(" ORDER BY transactions.transaction_date DESC, transactions.created_at DESC");

        Ok(query
            .build_query_as::<ReportTransaction>()
            .fetch_all(pool)
            .await?)
    }

    pub async fn previous_period_transactions(
        pool: &SqlitePool,
        request: &ReportRequest,
        previous_start_date: &str,
        previous_end_date: &str,
    ) -> Result<Vec<ReportTransaction>, AppError> {
        let previous_request = ReportRequest {
            start_date: previous_start_date.to_string(),
            end_date: previous_end_date.to_string(),
            account_id: request.account_id.clone(),
            category_id: request.category_id.clone(),
            transaction_type: request.transaction_type.clone(),
            currency: request.currency.clone(),
        };

        Self::matching_transactions(pool, &previous_request).await
    }

    pub async fn accounts(
        pool: &SqlitePool,
        request: &ReportRequest,
    ) -> Result<Vec<ReportAccountRow>, AppError> {
        let mut query = QueryBuilder::<Sqlite>::new(
            r#"
            SELECT
                accounts.id,
                accounts.name,
                accounts.account_type,
                accounts.currency,
                accounts.initial_balance_minor + COALESCE(SUM(
                    CASE
                        WHEN transactions.transaction_type = 'income' THEN transactions.amount_minor
                        WHEN transactions.transaction_type = 'expense' THEN -transactions.amount_minor
                        ELSE 0
                    END
                ), 0) AS balance_minor,
                accounts.is_archived
            FROM accounts
            LEFT JOIN transactions ON transactions.account_id = accounts.id
            WHERE 1 = 1
            "#,
        );

        push_optional_filter(
            &mut query,
            " AND accounts.id = ",
            request.account_id.as_deref(),
        );
        push_optional_filter(
            &mut query,
            " AND accounts.currency = ",
            request.currency.as_deref(),
        );

        query.push(
            r#"
            GROUP BY
                accounts.id,
                accounts.name,
                accounts.account_type,
                accounts.currency,
                accounts.initial_balance_minor,
                accounts.is_archived
            ORDER BY accounts.is_archived ASC, accounts.created_at DESC
            "#,
        );

        Ok(query
            .build_query_as::<ReportAccountRow>()
            .fetch_all(pool)
            .await?)
    }

    pub async fn budgets(
        pool: &SqlitePool,
        request: &ReportRequest,
    ) -> Result<Vec<ReportBudgetRow>, AppError> {
        let mut query = QueryBuilder::<Sqlite>::new(
            r#"
            SELECT
                budgets.id,
                budgets.name,
                budgets.category_id,
                categories.name AS category_name,
                budgets.amount_minor,
                budgets.month,
                budgets.year
            FROM budgets
            INNER JOIN categories ON categories.id = budgets.category_id
            WHERE budgets.is_archived = 0
                AND date(printf('%04d-%02d-01', budgets.year, budgets.month)) <= date(
                    "#,
        );

        query.push_bind(request.end_date.trim().to_string());
        query.push(
            r#"
                )
                AND date(printf('%04d-%02d-01', budgets.year, budgets.month), '+1 month', '-1 day') >= date(
            "#,
        );
        query.push_bind(request.start_date.trim().to_string());
        query.push(")");

        push_optional_filter(
            &mut query,
            " AND budgets.category_id = ",
            request.category_id.as_deref(),
        );

        query.push(" ORDER BY budgets.year DESC, budgets.month DESC, budgets.created_at DESC");

        Ok(query
            .build_query_as::<ReportBudgetRow>()
            .fetch_all(pool)
            .await?)
    }

    pub async fn recurring_bills(
        pool: &SqlitePool,
        request: &ReportRequest,
    ) -> Result<Vec<ReportRecurringBillRow>, AppError> {
        let mut query = QueryBuilder::<Sqlite>::new(
            r#"
            SELECT
                recurring_bills.id,
                recurring_bills.name,
                accounts.currency,
                recurring_bills.amount_minor,
                recurring_bills.next_due_date,
                recurring_bills.last_paid_date
            FROM recurring_bills
            INNER JOIN accounts ON accounts.id = recurring_bills.account_id
            WHERE recurring_bills.is_archived = 0
                AND (
                    recurring_bills.next_due_date BETWEEN
            "#,
        );

        query.push_bind(request.start_date.trim().to_string());
        query.push(" AND ");
        query.push_bind(request.end_date.trim().to_string());
        query.push(" OR recurring_bills.last_paid_date BETWEEN ");
        query.push_bind(request.start_date.trim().to_string());
        query.push(" AND ");
        query.push_bind(request.end_date.trim().to_string());
        query.push(")");

        push_optional_filter(
            &mut query,
            " AND recurring_bills.account_id = ",
            request.account_id.as_deref(),
        );
        push_optional_filter(
            &mut query,
            " AND recurring_bills.category_id = ",
            request.category_id.as_deref(),
        );
        push_optional_filter(
            &mut query,
            " AND accounts.currency = ",
            request.currency.as_deref(),
        );

        query.push(" ORDER BY recurring_bills.next_due_date ASC, recurring_bills.created_at DESC");

        Ok(query
            .build_query_as::<ReportRecurringBillRow>()
            .fetch_all(pool)
            .await?)
    }

    pub async fn savings_goals(pool: &SqlitePool) -> Result<Vec<ReportSavingsGoalRow>, AppError> {
        Ok(sqlx::query_as::<_, ReportSavingsGoalRow>(
            r#"
            SELECT
                id,
                name,
                target_amount_minor,
                current_amount_minor,
                is_archived
            FROM savings_goals
            "#,
        )
        .fetch_all(pool)
        .await?)
    }

    pub async fn currencies(pool: &SqlitePool) -> Result<Vec<String>, AppError> {
        Ok(sqlx::query_scalar::<_, String>(
            r#"
            SELECT DISTINCT currency
            FROM accounts
            ORDER BY currency ASC
            "#,
        )
        .fetch_all(pool)
        .await?)
    }
}

fn push_optional_filter(query: &mut QueryBuilder<Sqlite>, sql: &'static str, value: Option<&str>) {
    if let Some(value) = value.map(str::trim).filter(|value| !value.is_empty()) {
        query.push(sql).push_bind(value.to_string());
    }
}
