use crate::models::campaign::Campaign;
use crate::models::error::ChainsawError;
use crate::models::role::{CreateRole, Role, UpdateRole};
use crate::models::state::{ApiState, BaseState};
use crate::snowflake::Snowflake;
use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::routing::{delete, get, patch, post};
use axum::{Json, Router};
use serde_json::json;

/// The router for all role routes.
pub(super) fn router() -> Router<ApiState> {
    // By having each module responsible for setting up its own routing,
    // it makes the root module a lot cleaner.
    Router::new()
        .route("/", post(post_role))
        .route("/", get(get_roles))
        .route("/{role_id}", get(get_role))
        .route("/{role_id}", patch(patch_role))
        .route("/{role_id}", delete(delete_role))
}

async fn post_role(
    State(state): State<BaseState>,
    Path(campaign_id): Path<Snowflake>,
    Json(data): Json<CreateRole>,
) -> Result<impl IntoResponse, ChainsawError> {
    // TODO: Handle users
    // TODO: Move all validate numbers to constants (or provide field validators)
    if data.title.chars().count() > 50 {
        return Err(ChainsawError::RoleTitleTooLong);
    }

    if data.description.chars().count() > 200 {
        return Err(ChainsawError::RoleDescriptionTooLong);
    }

    if !(1..=100).contains(&data.no_of_positions) {
        return Err(ChainsawError::RoleInvalidPositions);
    }

    ensure_campaign_exists(campaign_id, &state).await?;

    let role_id = Role::create(
        data.title,
        data.description,
        data.no_of_positions,
        data.enable_abstention,
        campaign_id,
        &state.id_gen,
        &state.db,
    )
    .await?;

    Ok((StatusCode::CREATED, Json(json!({"role_id": role_id}))))
}

async fn get_roles(
    State(state): State<BaseState>,
    Path(campaign_id): Path<Snowflake>,
) -> Result<impl IntoResponse, ChainsawError> {
    // TODO: Handle users
    // Normally not the end of the world if a campaign isn't found when looking up a role
    // However this case we'd just see an empty list and not know if the campaign exists
    ensure_campaign_exists(campaign_id, &state).await?;
    // We can still race here, but that's a non-issue since this is read-only anyway...
    let roles = Role::get_all(campaign_id, &state.db).await?;

    Ok(Json(roles))
}

async fn get_role(
    State(state): State<BaseState>,
    Path((campaign_id, role_id)): Path<(Snowflake, Snowflake)>,
) -> Result<impl IntoResponse, ChainsawError> {
    // TODO: Handle users
    // Note that is a campaign does not exist, the error
    // will just say role not found (cheaper for database)
    let role = Role::get(campaign_id, role_id, &state.db)
        .await?
        .ok_or(ChainsawError::RoleNotFound)?;

    Ok(Json(role))
}

async fn patch_role(
    State(state): State<BaseState>,
    Path((campaign_id, role_id)): Path<(Snowflake, Snowflake)>,
    Json(data): Json<UpdateRole>,
) -> Result<impl IntoResponse, ChainsawError> {
    // TODO: Handle users
    if data.is_empty() {
        return Err(ChainsawError::UpdateRequestEmpty);
    }

    if data
        .title
        .as_ref()
        .is_some_and(|title| title.chars().count() > 50)
    {
        return Err(ChainsawError::RoleTitleTooLong);
    }

    if data
        .description
        .as_ref()
        .is_some_and(|description| description.chars().count() > 200)
    {
        return Err(ChainsawError::RoleDescriptionTooLong);
    }

    if data
        .no_of_positions
        .as_ref()
        .is_some_and(|&no_of_positions| !(1..=100).contains(&no_of_positions))
    {
        return Err(ChainsawError::RoleInvalidPositions);
    }

    // Same error quirk as above
    Role::update(campaign_id, role_id, data, &state.db).await?;

    Ok(StatusCode::NO_CONTENT)
}

async fn delete_role(
    State(state): State<BaseState>,
    Path((campaign_id, role_id)): Path<(Snowflake, Snowflake)>,
) -> Result<impl IntoResponse, ChainsawError> {
    // TODO: Handle users
    // Same error quirk as above
    Role::delete(campaign_id, role_id, &state.db).await?;

    Ok(StatusCode::NO_CONTENT)
}

async fn ensure_campaign_exists(
    campaign_id: Snowflake,
    state: &BaseState,
) -> Result<(), ChainsawError> {
    if !Campaign::exists(campaign_id, &state.db).await? {
        return Err(ChainsawError::CampaignNotFound);
    }

    Ok(())
}
