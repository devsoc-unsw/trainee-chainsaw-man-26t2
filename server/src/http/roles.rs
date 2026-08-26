use crate::models::error::ChainsawError;
use crate::models::role::{CreateRole, Role, UpdateRole};
use crate::models::state::{ApiState, BaseState};
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
    Path(campaign_id): Path<i64>,
    Json(data): Json<CreateRole>,
) -> Result<impl IntoResponse, ChainsawError> {
    // TODO: Handle users
    // TODO: Move all validate numbers to constants (or provide field validators)
    if data.title.len() > 50 {
        return Err(ChainsawError::RoleTitleTooLong);
    }

    if data.description.len() > 200 {
        return Err(ChainsawError::RoleDescriptionTooLong);
    }

    if data.no_of_positions < 1 || data.no_of_positions > 100 {
        return Err(ChainsawError::RoleInvalidPositions);
    }

    let role_id = crate::models::role::Role::create(
        data.title,
        data.description,
        data.no_of_positions,
        data.enable_abstention,
        campaign_id,
        &state.id_gen,
        &state.db,
    )
    .await?;

    Ok((StatusCode::OK, Json(json!({"role_id": role_id}))))
}

async fn get_roles(
    State(state): State<BaseState>,
    Path(campaign_id): Path<i64>,
) -> Result<impl IntoResponse, ChainsawError> {
    // TODO: Handle users
    // TODO: Give nice error if campaign does not exist?
    let roles = sqlx::query_as!(
        Role,
        r#"SELECT
            role_id,
            title,
            description,
            no_of_positions,
            enable_abstention
        FROM "campaign_roles"
        WHERE campaign_id = $1"#,
        campaign_id
    )
    .fetch_all(&state.db)
    .await?;

    Ok(Json(roles))
}

async fn get_role(
    State(state): State<BaseState>,
    Path((campaign_id, role_id)): Path<(i64, i64)>,
) -> Result<impl IntoResponse, ChainsawError> {
    // TODO: Handle users
    // TODO: Do we care if the campaign does not exist?
    let role = sqlx::query_as!(
        Role,
        r#"SELECT
            role_id,
            title,
            description,
            no_of_positions,
            enable_abstention
        FROM "campaign_roles"
        WHERE campaign_id = $1 AND role_id = $2"#,
        campaign_id,
        role_id
    )
    .fetch_optional(&state.db)
    .await?;

    if role.is_none() {
        return Err(ChainsawError::RoleNotFound);
    }

    Ok(Json(role))
}

async fn patch_role(
    State(state): State<BaseState>,
    Path((campaign_id, role_id)): Path<(i64, i64)>,
    Json(data): Json<UpdateRole>,
) -> Result<impl IntoResponse, ChainsawError> {
    // TODO: Handle users
    if data.title.as_ref().is_some_and(|title| title.len() > 50) {
        return Err(ChainsawError::RoleTitleTooLong);
    }

    if data
        .description
        .as_ref()
        .is_some_and(|description| description.len() > 200)
    {
        return Err(ChainsawError::RoleDescriptionTooLong);
    }

    if data
        .no_of_positions
        .as_ref()
        .is_some_and(|&no_of_positions| no_of_positions < 1 || no_of_positions > 100)
    {
        return Err(ChainsawError::RoleInvalidPositions);
    }

    let result = sqlx::query!(
        r#"
        UPDATE "campaign_roles"
        SET
            title = COALESCE($1, title),
            description = COALESCE($2, description),
            no_of_positions = COALESCE($3, no_of_positions),
            enable_abstention = COALESCE($4, enable_abstention)
        WHERE campaign_id = $5 AND role_id = $6
        "#,
        data.title,
        data.description,
        data.no_of_positions,
        data.enable_abstention,
        campaign_id,
        role_id
    )
    .execute(&state.db)
    .await?;

    if result.rows_affected() == 0 {
        return Err(ChainsawError::RoleNotFound);
    }

    Ok(StatusCode::NO_CONTENT)
}

async fn delete_role(
    State(state): State<BaseState>,
    Path((campaign_id, role_id)): Path<(i64, i64)>,
) -> Result<impl IntoResponse, ChainsawError> {
    // TODO: Handle users
    let result = sqlx::query!(
        r#"DELETE FROM "campaign_roles" WHERE campaign_id = $1 AND role_id = $2"#,
        campaign_id,
        role_id
    )
    .execute(&state.db)
    .await?;

    if result.rows_affected() == 0 {
        return Err(ChainsawError::RoleNotFound);
    }

    Ok(StatusCode::NO_CONTENT)
}
