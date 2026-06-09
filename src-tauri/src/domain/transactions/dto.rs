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

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateTransactionRequest {
    pub id: String,
    pub account_id: String,
    pub category_id: String,
    pub transaction_type: String,
    pub amount_minor: i64,
    pub description: Option<String>,
    pub transaction_date: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeleteTransactionRequest {
    pub id: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TransactionFilterRequest {
    pub account_id: Option<String>,
    pub category_id: Option<String>,
    pub transaction_type: Option<String>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub search: Option<String>,
}
