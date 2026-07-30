use crate::http::ApiContext;
use axum::Router;

/// The router for all user routes.
pub fn router() -> Router<ApiContext> {
    // By having each module responsible for setting up its own routing,
    // it makes the root module a lot cleaner.
    Router::new()
}
