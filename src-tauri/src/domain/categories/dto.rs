use serde::Deserialize;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateCategoryRequest {
    pub name: String,
    pub category_type: String,
    pub icon: Option<String>,
    pub color: Option<String>,
}
