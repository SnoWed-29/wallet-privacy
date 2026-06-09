use serde::Serialize;
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Account {
    pub id: String,
    pub name: String,
    pub account_type: String,
    pub currency: String,
    pub initial_balance_minor: i64,
    pub balance_minor: i64,
    pub is_archived: bool,
    pub created_at: String,
    pub updated_at: String,
}
