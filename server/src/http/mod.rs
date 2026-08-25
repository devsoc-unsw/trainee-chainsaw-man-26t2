use crate::config::Config;
use crate::models::state::ApiState;
use crate::snowflake::SnowflakeGen;
use anyhow::Context;
use axum::Router;
use axum::http::{Method, header};
use sqlx::PgPool;
use tokio::net::TcpListener;
use tower_http::cors::CorsLayer;

// Import routing modules
mod auth;
mod campaigns;
mod candidates;
mod results;
mod roles;
mod vote;
mod voters;

/// Create and return the API router for the application.
///
/// Includes a CORS layer to enable interoperability with the frontend.
fn api_router() -> Router<ApiState> {
    // Create CORS layer
    let cors = CorsLayer::new()
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::DELETE,
            Method::PUT,
            Method::PATCH,
        ])
        .allow_headers([
            header::ACCEPT,
            header::COOKIE,
            header::SET_COOKIE,
            header::CONTENT_TYPE,
        ])
        .allow_credentials(true)
        .allow_origin([
            "http://localhost".parse().unwrap(),
            "http://localhost:3000".parse().unwrap(),
        ]);

    // Return merged router, with CORS layer
    Router::new()
        .nest("/campaigns", campaigns::router())
        .nest("/vote", vote::router())
        .nest("/auth", auth::router())
        .layer(cors)
}

/// Start serving the API.
pub async fn serve(config: Config, db: PgPool, id_gen: SnowflakeGen) -> anyhow::Result<()> {
    // Create application
    let app = api_router().with_state(ApiState::new(config, db, id_gen));

    // Create listener on port 8080
    let listener = TcpListener::bind("0.0.0.0:8080")
        .await
        .context("Error creating TCP listener on port 8080.")?;

    // Serve application
    axum::serve(listener, app)
        .await
        .context("Error starting HTTP server.")
}
