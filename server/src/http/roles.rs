use crate::models::state::ApiState;
use axum::Router;

/// The router for all campaign routes.
pub(super) fn router() -> Router<ApiState> {
    // By having each module responsible for setting up its own routing,
    // it makes the root module a lot cleaner.
    Router::new()
}
