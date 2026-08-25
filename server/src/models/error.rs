use axum::Json;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use serde_json::json;

#[derive(thiserror::Error, Debug)]
#[allow(clippy::enum_variant_names)]
pub(crate) enum ChainsawError {
    #[error("Campaign title too long.")]
    CampaignTitleTooLong,
    #[error("Campaign description too long.")]
    CampaignDescriptionTooLong,
    #[error("Campaign start time must be before campaign end time.")]
    CampaignDatesInvalid,
    #[error("Database error.")]
    DatabaseError(#[from] sqlx::Error),
}

impl IntoResponse for ChainsawError {
    fn into_response(self) -> Response {
        let status_code = match self {
            Self::CampaignTitleTooLong
            | Self::CampaignDescriptionTooLong
            | Self::CampaignDatesInvalid => StatusCode::UNPROCESSABLE_ENTITY,
            Self::DatabaseError(_) => StatusCode::INTERNAL_SERVER_ERROR,
        };

        // Return error
        (status_code, Json(json!({"error": self.to_string()}))).into_response()
    }
}
