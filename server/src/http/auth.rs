use crate::models::auth::AuthState;
use crate::models::error::ChainsawError;
use crate::models::state::{ApiState, BaseState};
use crate::models::user::User;
use crate::models::user_identity::UserIdentity;
use crate::snowflake::Snowflake;
use axum::Router;
use axum::extract::{Query, State};
use axum::response::{IntoResponse, Redirect};
use axum::routing::get;
use axum_session_auth::AuthSession;
use axum_session_sqlx::SessionPgPool;
use openidconnect::core::CoreAuthenticationFlow;
use openidconnect::{
    AuthorizationCode, CsrfToken, EndUserEmail, Nonce, PkceCodeChallenge, PkceCodeVerifier, Scope,
    TokenResponse,
};
use serde::Deserialize;
use sqlx::PgPool;

/// The router for all campaign routes.
pub(super) fn router() -> Router<ApiState> {
    // By having each module responsible for setting up its own routing,
    // it makes the root module a lot cleaner.
    Router::new()
        .route("/google", get(google_login))
        .route("/google/callback", get(google_callback))
}

#[derive(Debug, Deserialize)]
struct GoogleLoginQuery {
    redirect: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct GoogleCallback {
    pub code: Option<String>,
    pub state: Option<String>,
    pub error: Option<String>,
    pub error_description: Option<String>,
}

async fn google_login(
    State(auth): State<AuthState>,
    Query(query): Query<GoogleLoginQuery>,
    session: AuthSession<User, Snowflake, SessionPgPool, PgPool>,
) -> Result<impl IntoResponse, ChainsawError> {
    // Generate PKCE
    let (pkce_challenge, pkce_verifier) = PkceCodeChallenge::new_random_sha256();

    // Create google authorise URL
    let (authorise_url, state, nonce) = auth
        .google
        .client
        .authorize_url(
            CoreAuthenticationFlow::AuthorizationCode,
            CsrfToken::new_random,
            Nonce::new_random,
        )
        .add_scope(Scope::new("openid".into()))
        .add_scope(Scope::new("email".into()))
        .add_scope(Scope::new("profile".into()))
        .set_pkce_challenge(pkce_challenge)
        .url();

    // Store callback info in user session
    session.session.set("oauth_state", state);
    session.session.set("nonce", nonce);
    session.session.set("pkce_verifier", pkce_verifier);
    session.session.set(
        "oauth_redirect",
        query.redirect.unwrap_or(String::from("/")),
    );

    Ok(Redirect::to(authorise_url.as_str()))
}

async fn google_callback(
    State(state): State<BaseState>,
    State(auth_state): State<AuthState>,
    Query(query): Query<GoogleCallback>,
    session: AuthSession<User, Snowflake, SessionPgPool, PgPool>,
) -> Result<impl IntoResponse, ChainsawError> {
    // Retrieve OAuth state from session
    let expected_state: Option<CsrfToken> = session.session.get("oauth_state");

    // Compare returned state
    if query.state != expected_state.map(|s| s.secret().to_owned()) {
        return Err(ChainsawError::AuthError);
    }

    // Retrieve PKCE verifier
    let verifier: PkceCodeVerifier = match session.session.get("pkce_verifier") {
        Some(verifier) => verifier,
        None => return Err(ChainsawError::AuthError),
    };

    // Retrieve oauth redirect URL
    let redirect_url: String = session
        .session
        .get("oauth_redirect")
        .unwrap_or(String::from("/"));

    // Get query code
    let auth_code = match query.code {
        Some(code) => AuthorizationCode::new(code),
        None => return Err(ChainsawError::AuthError),
    };

    // Get nonce
    let nonce: Nonce = match session.session.get("nonce") {
        Some(nonce) => nonce,
        None => return Err(ChainsawError::AuthError),
    };

    // Exchange authorisation code
    let token_response = auth_state
        .google
        .client
        .exchange_code(auth_code)
        .map_err(|_| ChainsawError::AuthError)?
        .set_pkce_verifier(verifier)
        .request_async(&auth_state.client)
        .await
        .map_err(|_| ChainsawError::AuthError)?;

    // Validate ID token / nonce
    let id_token = token_response.id_token().ok_or(ChainsawError::AuthError)?;

    let claims = id_token
        .claims(&auth_state.google.client.id_token_verifier(), &nonce)
        .map_err(|_| ChainsawError::AuthError)?;

    // Get Google subject and email
    let google_sub = claims.subject().as_str();
    let google_email: Option<&EndUserEmail> = claims.email();

    // Find/create local user
    let user_id =
        match UserIdentity::get(String::from("google"), String::from(google_sub), &state.db).await?
        {
            Some(identity) => identity.user_id,
            None => {
                User::create(
                    google_email.map(|e| e.to_string()),
                    &state.id_gen,
                    &state.db,
                )
                .await?
            }
        };

    // Fetch user
    let user = User::get(user_id, &state.db)
        .await?
        .ok_or(ChainsawError::AuthError)?;

    // Convert the external identity into an app session
    session.login_user(user_id);

    // 9. Redirect
    Ok(Redirect::to(&redirect_url))
}
