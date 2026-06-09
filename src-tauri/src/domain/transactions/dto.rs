use serde::Deserialize;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTransactionRequest {
    pub account_id: String,
    pub category_id: String,
    pub transaction_type: String,
    pub amount_minor: i64,
    pub description: Option<String>,
    pub transaction_date: String,
}
