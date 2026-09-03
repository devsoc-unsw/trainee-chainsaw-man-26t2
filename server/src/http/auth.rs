use crate::models::auth::AuthState;
use crate::models::error::ChainsawError;
use crate::models::state::{ApiState, BaseState};
use axum::Router;
use axum::extract::State;
use axum::response::{IntoResponse, Redirect};
use axum::routing::get;
use openidconnect::core::CoreAuthenticationFlow;
use openidconnect::{CsrfToken, Nonce, PkceCodeChallenge, Scope};

/// The router for all campaign routes.
pub(super) fn router() -> Router<ApiState> {
    // By having each module responsible for setting up its own routing,
    // it makes the root module a lot cleaner.
    Router::new().route("/google", get(google_login))
}

async fn google_login(
    State(state): State<BaseState>,
    State(auth): State<AuthState>,
    // TODO: Extract user session using axum_session_auth
) -> Result<impl IntoResponse, ChainsawError> {
    // Generate CSRF state
    let csrf_state = CsrfToken::new_random();

    // Generate nonce
    let nonce = Nonce::new_random();

    // Generate PKCE
    let (pkce_challenge, pkce_verifier) = PkceCodeChallenge::new_random_sha256();

    let (authorize_url, state, nonce) = auth
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

    // TODO: Store callback info in user session

    Ok(Redirect::to(authorize_url.as_str()))
}
