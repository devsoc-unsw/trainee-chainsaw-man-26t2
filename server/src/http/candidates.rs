use crate::models::candidate::{Candidate, CreateCandidate, UpdateCandidate};
use crate::models::error::ChainsawError;
use crate::models::state::{ApiState, BaseState};
use crate::snowflake::Snowflake;
use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::routing::{delete, get, patch};
use axum::{Json, Router};
use serde_json::json;

/// The router for all candidate routes.
pub(super) fn router() -> Router<ApiState> {
    // By having each module responsible for setting up its own routing,
    // it makes the root module a lot cleaner.
    Router::new()
        .route("/", axum::routing::post(post_candidate))
        .route("/", get(get_candidates))
        .route("/{candidate_id}", get(get_candidate))
        .route("/{candidate_id}", patch(patch_candidate))
        .route("/{candidate_id}", delete(delete_candidate))
}

async fn post_candidate(
    State(state): State<BaseState>,
    Path(campaign_id): Path<Snowflake>,
    Json(data): Json<CreateCandidate>,
) -> Result<impl IntoResponse, ChainsawError> {
    // TODO: Handle users
    if data
        .manifesto
        .as_ref()
        .is_some_and(|m| m.chars().count() > 1000)
    {
        return Err(ChainsawError::CandidateManifestoTooLong);
    }

    if !data.role_ids_are_valid() {
        return Err(ChainsawError::CandidateRoleIdsInvalid);
    }

    // TODO: Validate email format
    let candidate_id = Candidate::create(
        data.first_name,
        data.last_name,
        data.email,
        data.manifesto,
        campaign_id,
        &data.role_ids,
        &state.id_gen,
        &state.db,
    )
    .await?;

    Ok((
        StatusCode::CREATED,
        Json(json!({"candidate_id": candidate_id})),
    ))
}

async fn get_candidates(
    State(state): State<BaseState>,
    Path(campaign_id): Path<Snowflake>,
) -> Result<impl IntoResponse, ChainsawError> {
    // TODO: Handle users
    let candidates = sqlx::query_as!(
    Candidate,
    r#"
    SELECT
        c.candidate_id,
        c.first_name,
        c.last_name,
        c.email,
        c.manifesto,
        COALESCE(array_agg(cr.role_id) FILTER (WHERE cr.role_id IS NOT NULL), '{}') AS "role_ids!: Vec<i64>"
    FROM "candidates" c
    LEFT JOIN "candidate_roles" cr ON cr.candidate_id = c.candidate_id
    WHERE c.campaign_id = $1
    GROUP BY c.candidate_id
    "#,
    campaign_id.get()
    )
.fetch_all(&state.db)
.await?;

    Ok((StatusCode::OK, Json(candidates)))
}

async fn get_candidate(
    State(state): State<BaseState>,
    Path((campaign_id, candidate_id)): Path<(Snowflake, Snowflake)>,
) -> Result<impl IntoResponse, ChainsawError> {
    // TODO Handle users
    let candidate = sqlx::query_as!(
        Candidate,
        r#"
        SELECT
            c.candidate_id,
            c.first_name,
            c.last_name,
            c.email,
            c.manifesto,
            COALESCE(array_agg(cr.role_id) FILTER (WHERE cr.role_id IS NOT NULL), '{}') AS "role_ids!: Vec<i64>"
        FROM "candidates" c
        LEFT JOIN "candidate_roles" cr ON cr.candidate_id = c.candidate_id
        WHERE c.campaign_id = $1 AND c.candidate_id = $2
        GROUP BY c.candidate_id
        "#,
        campaign_id.get(),
        candidate_id.get()
    )
    .fetch_optional(&state.db)
    .await?;

    if candidate.is_none() {
        return Err(ChainsawError::CandidateNotFound);
    }

    Ok((StatusCode::OK, Json(candidate)))
}

async fn patch_candidate(
    State(state): State<BaseState>,
    Path((campaign_id, candidate_id)): Path<(Snowflake, Snowflake)>,
    Json(data): Json<UpdateCandidate>,
) -> Result<impl IntoResponse, ChainsawError> {
    // TODO: Handle users
    if data.is_empty() {
        return Err(ChainsawError::UpdateRequestEmpty);
    }

    if data
        .manifesto
        .as_ref()
        .is_some_and(|m| m.chars().count() > 1000)
    {
        return Err(ChainsawError::CandidateManifestoTooLong);
    }

    if !data.role_ids_are_valid() {
        return Err(ChainsawError::CandidateRoleIdsInvalid);
    }

    let mut tx = state.db.begin().await?;

    let result = sqlx::query!(
        r#"
        UPDATE "candidates"
        SET
            first_name = COALESCE($1, first_name),
            last_name = COALESCE($2, last_name),
            email = COALESCE($3, email),
            manifesto = COALESCE($4, manifesto)
        WHERE campaign_id = $5 AND candidate_id = $6
        "#,
        data.first_name,
        data.last_name,
        data.email,
        data.manifesto,
        campaign_id.get(),
        candidate_id.get()
    )
    .execute(&mut *tx)
    .await?;

    if result.rows_affected() == 0 {
        return Err(ChainsawError::CandidateNotFound);
    }

    if let Some(role_ids) = data.role_ids {
        // Delete existing roles
        sqlx::query!(
            r#"DELETE FROM "candidate_roles" WHERE campaign_id = $1 AND candidate_id = $2"#,
            campaign_id.get(),
            candidate_id.get()
        )
        .execute(&mut *tx)
        .await?;

        // Insert new roles
        // TODO: Give nice error if role does not exist
        for role_id in role_ids {
            sqlx::query!(
                r#"INSERT INTO "candidate_roles" (candidate_id, role_id, campaign_id) VALUES ($1, $2, $3)"#,
                candidate_id.get(),
                role_id.get(),
                campaign_id.get()
            )
            .execute(&mut *tx)
            .await?;
        }
    }

    tx.commit().await?;
    Ok(StatusCode::NO_CONTENT)
}

async fn delete_candidate(
    State(state): State<BaseState>,
    Path((campaign_id, candidate_id)): Path<(Snowflake, Snowflake)>,
) -> Result<impl IntoResponse, ChainsawError> {
    // TODO: Handle users
    let result = sqlx::query!(
        r#"DELETE FROM "candidates" WHERE campaign_id = $1 AND candidate_id = $2"#,
        campaign_id.get(),
        candidate_id.get()
    )
    .execute(&state.db)
    .await?;

    if result.rows_affected() == 0 {
        return Err(ChainsawError::CandidateNotFound);
    }

    Ok(StatusCode::NO_CONTENT)
}
