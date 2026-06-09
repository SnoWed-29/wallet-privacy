use serde::Deserialize;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateRecurringBillRequest {
    pub name: String,
    pub account_id: String,
    pub category_id: String,
    pub amount_minor: i64,
    pub frequency: String,
    pub next_due_date: String,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateRecurringBillRequest {
    pub id: String,
    pub name: String,
    pub account_id: String,
    pub category_id: String,
    pub amount_minor: i64,
    pub frequency: String,
    pub next_due_date: String,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ArchiveRecurringBillRequest {
    pub id: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MarkRecurringBillPaidRequest {
    pub id: String,
    pub paid_date: Option<String>,
}
