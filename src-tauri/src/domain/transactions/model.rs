use serde::Serialize;
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Transaction {
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
