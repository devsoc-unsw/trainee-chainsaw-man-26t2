use crate::http::{ApiState, candidates, results, roles, voters};
use crate::models::campaign::{Campaign, CreateCampaign, UpdateCampaign};
use crate::models::error::ChainsawError;
use crate::models::state::BaseState;
use crate::snowflake::Snowflake;
use anyhow::Result;
use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::routing::{delete, get, patch, post};
use axum::{Json, Router};
use serde_json::json;

/// The router for all campaign routes.
pub(super) fn router() -> Router<ApiState> {
    // By having each module responsible for setting up its own routing,
    // it makes the root module a lot cleaner.
    Router::new()
        .route("/", post(post_campaign))
        .route("/", get(get_campaigns))
        .route("/{campaign_id}", get(get_campaign))
        .route("/{campaign_id}", patch(patch_campaign))
        .route("/{campaign_id}", delete(delete_campaign))
        .nest("/{campaign_id}/candidates", candidates::router())
        .nest("/{campaign_id}/roles", roles::router())
        .nest("/{campaign_id}/voters", voters::router())
        .nest("/{campaign_id}/results", results::router())
}

async fn post_campaign(
    State(state): State<BaseState>,
    Json(data): Json<CreateCampaign>,
) -> Result<impl IntoResponse, ChainsawError> {
    // TODO: Handle users
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

async fn get_campaigns(State(state): State<BaseState>) -> Result<impl IntoResponse, ChainsawError> {
    // TODO: Handle users
    let campaigns = sqlx::query_as!(Campaign, r#"SELECT * FROM "campaigns""#)
        .fetch_all(&state.db)
        .await?;

    Ok((StatusCode::OK, Json(json!(campaigns))))
}

async fn get_campaign(
    State(state): State<BaseState>,
    Path(campaign_id): Path<Snowflake>,
) -> Result<impl IntoResponse, ChainsawError> {
    // TODO: Handle users
    let campaign = sqlx::query_as!(
        Campaign,
        r#"SELECT * FROM "campaigns" WHERE campaign_id = $1"#,
        campaign_id.get(),
    )
    .fetch_optional(&state.db)
    .await?;

    if campaign.is_none() {
        return Err(ChainsawError::CampaignNotFound);
    }

    Ok((StatusCode::OK, Json(json!(campaign))))
}

async fn patch_campaign(
    State(state): State<BaseState>,
    Path(campaign_id): Path<Snowflake>,
    Json(data): Json<UpdateCampaign>,
) -> Result<impl IntoResponse, ChainsawError> {
    // TODO: Handle users
    if data.title.as_ref().is_some_and(|title| title.len() > 50) {
        return Err(ChainsawError::CampaignTitleTooLong);
    }

    if data
        .description
        .as_ref()
        .is_some_and(|description| description.len() > 2000)
    {
        return Err(ChainsawError::CampaignDescriptionTooLong);
    }

    // Only support updating date if both are provided
    // (makes it easier to validate that opening < closing)
    if data.opening_date_time.is_some() ^ data.closing_date_time.is_some() {
        return Err(ChainsawError::CampaignDatesInvalid);
    } else {
        if let (Some(opening), Some(closing)) = (data.opening_date_time, data.closing_date_time)
            && opening >= closing
        {
            return Err(ChainsawError::CampaignDatesInvalid);
        }
    }

    let result = sqlx::query!(
        r#"
        UPDATE "campaigns"
        SET
            title = COALESCE($1, title),
            description = COALESCE($2, description),
            opening_date_time = COALESCE($3, opening_date_time),
            closing_date_time = COALESCE($4, closing_date_time),
            allow_role_overlaps = COALESCE($5, allow_role_overlaps)
        WHERE campaign_id = $6
        "#,
        data.title,
        data.description,
        data.opening_date_time,
        data.closing_date_time,
        data.allow_role_overlaps,
        campaign_id.get(),
    )
    .execute(&state.db)
    .await?;

    if result.rows_affected() == 0 {
        return Err(ChainsawError::CampaignNotFound);
    }

    Ok(StatusCode::NO_CONTENT)
}

async fn delete_campaign(
    State(state): State<BaseState>,
    Path(campaign_id): Path<Snowflake>,
) -> Result<impl IntoResponse, ChainsawError> {
    // TODO: Handle users
    let result = sqlx::query!(
        r#"DELETE FROM "campaigns" WHERE campaign_id = $1"#,
        campaign_id.get(),
    )
    .execute(&state.db)
    .await?;

    if result.rows_affected() == 0 {
        return Err(ChainsawError::CampaignNotFound);
    }

    Ok(StatusCode::NO_CONTENT)
}
