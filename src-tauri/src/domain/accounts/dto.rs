use serde::Deserialize;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateAccountRequest {
    pub name: String,
    pub account_type: Option<String>,
    pub currency: Option<String>,
    pub initial_balance_minor: Option<i64>,
}
