use serde::Serialize;
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Budget {
    pub id: String,
    pub name: String,
    pub category_id: String,
    pub category_name: String,
    pub amount_minor: i64,
    pub spent_minor: i64,
    pub remaining_minor: i64,
    pub progress_percent: i64,
    pub month: i64,
    pub year: i64,
    pub is_archived: bool,
    pub created_at: String,
    pub updated_at: String,
}
