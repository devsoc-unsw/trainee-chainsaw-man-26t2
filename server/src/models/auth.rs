use anyhow::Result;
use openidconnect::core::{CoreClient, CoreProviderMetadata};
use openidconnect::{
    ClientId, ClientSecret, EndpointMaybeSet, EndpointNotSet, EndpointSet, IssuerUrl, RedirectUrl,
};
use reqwest::redirect::Policy;
use reqwest::{Client, ClientBuilder};
use std::env;
use std::sync::Arc;

/// The google auth client type.
pub type GoogleAuthClient = CoreClient<
    EndpointSet,
    EndpointNotSet,
    EndpointNotSet,
    EndpointNotSet,
    EndpointMaybeSet,
    EndpointMaybeSet,
>;

/// The auth state accepted by auth routes on the backend.
#[derive(Clone)]
#[allow(dead_code)] // TODO: Remove this once the API is implemented
pub(crate) struct AuthState {
    /// The HTTP client for auth routes.
    pub(crate) client: Client,

    /// The auth provider for Google.
    pub(crate) google: Arc<AuthProvider<GoogleAuthClient>>,
}

impl AuthState {
    /// Create and initialise a new auth state, reading secrets from the environment.
    ///
    /// Panics on fail, so should only be used on startup.
    pub async fn new() -> Result<Self> {
        // Create HTTP client for auth.
        let client = ClientBuilder::new().redirect(Policy::none()).build()?;

        // Get google auth provider
        let google = Arc::new(initialise_google_auth(&client).await?);

        // Return created state struct
        Ok(Self { client, google })
    }
}

/// A single auth provider.
pub(crate) struct AuthProvider<C> {
    pub(crate) client: C,
}

impl<C> AuthProvider<C> {
    /// Create a new auth provider, given its core client.
    pub fn new(client: C) -> Self {
        Self { client }
    }
}

/// Initialise the auth provider for Google.
async fn initialise_google_auth(http_client: &Client) -> Result<AuthProvider<GoogleAuthClient>> {
    // Get Google client ID and secret
    let client_id = env::var("GOOGLE_CLIENT_ID")?;
    let client_secret = env::var("GOOGLE_CLIENT_SECRET")?;
    let redirect_uri = env::var("GOOGLE_REDIRECT_URI")?;

    // Get provider metadata
    let provider_metadata = CoreProviderMetadata::discover_async(
        IssuerUrl::new(String::from("https://accounts.google.com"))?,
        http_client,
    )
    .await?;

    // Create OIDC client
    let client = CoreClient::from_provider_metadata(
        provider_metadata,
        ClientId::new(client_id),
        Some(ClientSecret::new(client_secret)),
    )
    .set_redirect_uri(RedirectUrl::new(redirect_uri)?);

    // Create and return auth provider
    Ok(AuthProvider::new(client))
}
