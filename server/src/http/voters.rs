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
use uuid::Uuid;

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
    let mut voter_ids: Vec<Snowflake> = Vec::with_capacity(data.emails.len());
    for _ in &data.emails {
        voter_ids.push(state.id_gen.generate().await);
    }

    // TODO: Give a nice error for duplicate emails
    sqlx::query!(
        r#"
        INSERT INTO campaign_voters (voter_id, email, campaign_id)
        SELECT v, e, $3
        FROM UNNEST($1::bigint[], $2::text[]) AS t(v, e)
        "#,
        &voter_ids.iter().map(|id| id.get()).collect::<Vec<i64>>(),
        &data.emails,
        campaign_id.get()
    )
    .execute(&state.db)
    .await?;

    Ok((StatusCode::OK, Json(json!({"voter_ids": voter_ids}))))
}

async fn get_voters(
    State(state): State<BaseState>,
    Path(campaign_id): Path<Snowflake>,
) -> Result<impl IntoResponse, ChainsawError> {
    let voters = sqlx::query_as!(
        Voter,
        r#"
        SELECT voter_id, email, voting_token, has_voted
        FROM campaign_voters
        WHERE campaign_id = $1
        "#,
        campaign_id.get()
    )
    .fetch_all(&state.db)
    .await?;

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
    // TODO: Nicer error handling?
    // - Campaign not found
    // - IDs not found
    sqlx::query!(
        r#"
        DELETE FROM campaign_voters
        WHERE campaign_id = $1 AND voter_id = ANY($2)
        "#,
        campaign_id.get(),
        &data
            .voter_ids
            .iter()
            .map(|id| id.get())
            .collect::<Vec<i64>>()
    )
    .execute(&state.db)
    .await?;

    Ok(StatusCode::NO_CONTENT)
}

async fn invite_voters(
    State(state): State<BaseState>,
    Path(campaign_id): Path<Snowflake>,
) -> Result<impl IntoResponse, ChainsawError> {
    let mut voters = sqlx::query_as!(
        Voter,
        r#"
        SELECT voter_id, email, voting_token, has_voted
        FROM campaign_voters
        WHERE campaign_id = $1 AND voting_token IS NULL
        "#,
        campaign_id.get()
    )
    .fetch_all(&state.db)
    .await?;

    voters.iter_mut().for_each(|v| {
        v.voting_token = Some(Uuid::new_v4());
    });

    let mut tx = state.db.begin().await?;
    for voter in &voters {
        sqlx::query!(
            r#"
            UPDATE campaign_voters
            SET voting_token = $1
            WHERE voter_id = $2
            "#,
            voter.voting_token,
            voter.voter_id.get()
        )
        .execute(&mut *tx)
        .await?;
    }
    tx.commit().await?;

    // TODO: Send emails to voters with their voting tokens
    // TODO: Should we store successful email sends in the database?
    // Otherwise we could fail here and not be able to re-send invites...
    // Not sure how to do this *perfectly*, since DB updates and email sending
    // are not one atomic operation. We may also want a re-send button just in case
    // we hit an issue where email isn't delivered.

    Ok(StatusCode::NO_CONTENT)
}
