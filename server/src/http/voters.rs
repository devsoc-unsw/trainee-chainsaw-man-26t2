use crate::models::error::ChainsawError;
use crate::models::state::{ApiState, BaseState};
use crate::models::voter::{Voter, VoterEmails, VoterIds, VoterResponse, VoterStatus};
use crate::snowflake::Snowflake;
use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::routing::{get, post};
use axum::{Json, Router};
use serde_json::json;

/// The router for all voter routes.
pub(super) fn router() -> Router<ApiState> {
    // By having each module responsible for setting up its own routing,
    // it makes the root module a lot cleaner.
    Router::new()
        .route("/", post(post_voters))
        .route("/", get(get_voters))
        .route("/delete", post(delete_voters))
        .route("/invite", post(invite_voters))
}

async fn post_voters(
    State(state): State<BaseState>,
    Path(campaign_id): Path<Snowflake>,
    Json(data): Json<VoterEmails>,
) -> Result<impl IntoResponse, ChainsawError> {
    if !data.emails_are_valid() {
        return Err(ChainsawError::VoterEmailsInvalid);
    }

    let mut voter_ids: Vec<Snowflake> = Vec::with_capacity(data.emails.len());
    for _ in &data.emails {
        voter_ids.push(state.id_gen.generate().await);
    }

    // TODO: Give a nice error for duplicate emails
    Voter::create_many(&voter_ids, &data.emails, campaign_id, &state.db).await?;

    Ok((StatusCode::CREATED, Json(json!({"voter_ids": voter_ids}))))
}

async fn get_voters(
    State(state): State<BaseState>,
    Path(campaign_id): Path<Snowflake>,
) -> Result<impl IntoResponse, ChainsawError> {
    let voters = Voter::get_all(campaign_id, &state.db).await?;

    let voters: Vec<VoterResponse> = voters
        .iter()
        .map(|v| VoterResponse {
            voter_id: v.voter_id,
            email: v.email.clone(),
            status: if v.has_voted {
                VoterStatus::Voted
            } else if v.voting_token.is_some() {
                VoterStatus::Invited
            } else {
                VoterStatus::Pending
            },
        })
        .collect();

    Ok((StatusCode::OK, Json(voters)))
}

async fn delete_voters(
    State(state): State<BaseState>,
    Path(campaign_id): Path<Snowflake>,
    Json(data): Json<VoterIds>,
) -> Result<impl IntoResponse, ChainsawError> {
    if !data.voter_ids_are_valid() {
        return Err(ChainsawError::VoterIdsInvalid);
    }

    // TODO: Nicer error handling?
    // - Campaign not found
    // - IDs not found
    Voter::delete_many(&data.voter_ids, campaign_id, &state.db).await?;

    Ok(StatusCode::NO_CONTENT)
}

async fn invite_voters(
    State(state): State<BaseState>,
    Path(campaign_id): Path<Snowflake>,
) -> Result<impl IntoResponse, ChainsawError> {
    let _invitations = Voter::invite_pending(campaign_id, &state.db).await?;

    // TODO: Send emails to voters with their voting tokens
    // TODO: Should we store successful email sends in the database?
    // Otherwise we could fail here and not be able to re-send invites...
    // Not sure how to do this *perfectly*, since DB updates and email sending
    // are not one atomic operation. We may also want a re-send button just in case
    // we hit an issue where email isn't delivered.

    Ok(StatusCode::ACCEPTED)
}
