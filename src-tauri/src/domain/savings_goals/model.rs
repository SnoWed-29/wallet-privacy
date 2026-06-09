use serde::Serialize;
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct SavingsGoal {
    pub id: String,
    pub name: String,
    pub target_amount_minor: i64,
    pub current_amount_minor: i64,
    pub remaining_amount_minor: i64,
    pub progress_percent: i64,
    pub deadline_date: Option<String>,
    pub is_archived: bool,
    pub created_at: String,
    pub updated_at: String,
}
