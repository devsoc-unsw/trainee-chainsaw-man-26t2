use crate::http::{ApiContext, candidates, results, roles, voters};
use axum::Router;

/// The router for all campaign routes.
pub(super) fn router() -> Router<ApiContext> {
    // By having each module responsible for setting up its own routing,
    // it makes the root module a lot cleaner.
    Router::new()
        .nest("/{campaign_id}/candidates", candidates::router())
        .nest("/{campaign_id}/roles", roles::router())
        .nest("/{campaign_id}/voters", voters::router())
        .nest("/{campaign_id}/results", results::router())
}
