use crate::config::Config;
use crate::models::state::ApiState;
use crate::models::user::User;
use crate::snowflake::{Snowflake, SnowflakeGen};
use anyhow::{Context, Result};
use axum::Router;
use axum::http::{Method, header};
use axum_session::{SessionConfig, SessionLayer, SessionStore};
use axum_session_auth::{AuthConfig, AuthSessionLayer};
use axum_session_sqlx::SessionPgPool;
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
///
/// Also includes an axum session auth layer for authentication across all routes.
async fn api_router(db: PgPool) -> Result<Router<ApiState>> {
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

    // Create auth layer
    let session_config = SessionConfig::default().with_table_name("auth_sessions");
    let auth_config = AuthConfig::<i64>::default();
    let session_store =
        SessionStore::<SessionPgPool>::new(Some(db.clone().into()), session_config).await?;
    let session_layer = SessionLayer::new(session_store);

    // Return merged router, with CORS layer
    Ok(Router::new()
        .nest("/campaigns", campaigns::router())
        .nest("/vote", vote::router())
        .nest("/auth", auth::router())
        .layer(AuthSessionLayer::<User, Snowflake, SessionPgPool, PgPool>::new(Some(db)))
        .layer(session_layer)
        .layer(cors))
}

/// Start serving the API.
pub async fn serve(config: Config, db: PgPool, id_gen: SnowflakeGen) -> Result<()> {
    // Create application
    let app = api_router(db.clone())
        .await?
        .with_state(ApiState::new(config, db, id_gen).await);

    // Create listener on port 8080
    let listener = TcpListener::bind("0.0.0.0:8080")
        .await
        .context("Error creating TCP listener on port 8080.")?;

    // Serve application
    axum::serve(listener, app)
        .await
        .context("Error starting HTTP server.")
}
