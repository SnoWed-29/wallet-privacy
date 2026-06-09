use serde::Deserialize;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateBudgetRequest {
    pub name: String,
    pub category_id: String,
    pub amount_minor: i64,
    pub month: i64,
    pub year: i64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateBudgetRequest {
    pub id: String,
    pub name: String,
    pub category_id: String,
    pub amount_minor: i64,
    pub month: i64,
    pub year: i64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ArchiveBudgetRequest {
    pub id: String,
}
