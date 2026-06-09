use serde::Serialize;
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct RecurringBill {
    pub id: String,
    pub name: String,
    pub account_id: String,
    pub account_name: String,
    pub category_id: String,
    pub category_name: String,
    pub amount_minor: i64,
    pub frequency: String,
    pub next_due_date: String,
    pub last_paid_date: Option<String>,
    pub description: Option<String>,
    pub is_archived: bool,
    pub created_at: String,
    pub updated_at: String,
}
