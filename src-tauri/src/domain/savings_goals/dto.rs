use serde::Deserialize;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateSavingsGoalRequest {
    pub name: String,
    pub target_amount_minor: i64,
    pub current_amount_minor: Option<i64>,
    pub deadline_date: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateSavingsGoalRequest {
    pub id: String,
    pub name: String,
    pub target_amount_minor: i64,
    pub current_amount_minor: i64,
    pub deadline_date: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ArchiveSavingsGoalRequest {
    pub id: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ContributeToSavingsGoalRequest {
    pub savings_goal_id: String,
    pub account_id: String,
    pub amount_minor: i64,
    pub transaction_date: Option<String>,
    pub description: Option<String>,
}
