use crate::http::{ApiState, candidates, results, roles, voters};
use crate::models::campaign::{Campaign, CreateCampaign};
use crate::models::error::ChainsawError;
use crate::models::state::BaseState;
use anyhow::Result;
use axum::extract::State;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::routing::post;
use axum::{Json, Router};
use serde_json::json;

/// The router for all campaign routes.
pub(super) fn router() -> Router<ApiState> {
    // By having each module responsible for setting up its own routing,
    // it makes the root module a lot cleaner.
    Router::new()
        .route("/", post(post_campaign))
        .nest("/{campaign_id}/candidates", candidates::router())
        .nest("/{campaign_id}/roles", roles::router())
        .nest("/{campaign_id}/voters", voters::router())
        .nest("/{campaign_id}/results", results::router())
}

async fn post_campaign(
    State(state): State<BaseState>,
    Json(data): Json<CreateCampaign>,
) -> Result<impl IntoResponse, ChainsawError> {
    // Validate inputs
    if data.title.len() > 50 {
        return Err(ChainsawError::CampaignTitleTooLong);
    }
    if data.description.len() > 2000 {
        return Err(ChainsawError::CampaignDescriptionTooLong);
    }
    if data.opening_date_time >= data.closing_date_time {
        return Err(ChainsawError::CampaignDatesInvalid);
    }

    // Create campaign
    let campaign_id = Campaign::create(
        data.title,
        data.description,
        data.opening_date_time,
        data.closing_date_time,
        data.allow_role_overlaps,
        &state.id_gen,
        &state.db,
    )
    .await?;

    Ok((StatusCode::OK, Json(json!({"campaign_id": campaign_id}))))
}
