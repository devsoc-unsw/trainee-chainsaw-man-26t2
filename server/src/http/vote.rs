use crate::models::error::ChainsawError;
use crate::models::state::{ApiState, BaseState};
use axum::Router;
use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::routing::{get, post};
use uuid::Uuid;

/// The router for all voting routes.
pub(super) fn router() -> Router<ApiState> {
    // By having each module responsible for setting up its own routing,
    // it makes the root module a lot cleaner.
    Router::new()
        .route("/{token}", get(get_ballot))
        .route("/{token}", post(post_ballot))
}

async fn get_ballot(
    State(state): State<BaseState>,
    Path(token): Path<Uuid>,
) -> Result<impl IntoResponse, ChainsawError> {
    Ok(StatusCode::OK)
}

async fn post_ballot(
    State(state): State<BaseState>,
    Path(token): Path<Uuid>,
) -> Result<impl IntoResponse, ChainsawError> {
    Ok(StatusCode::NO_CONTENT)
}
