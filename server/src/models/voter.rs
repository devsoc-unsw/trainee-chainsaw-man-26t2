use crate::models::error::ChainsawError;
use crate::snowflake::Snowflake;
use crate::utils::is_non_empty_unique;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Deserialize, Serialize)]
pub(crate) struct Voter {
    pub(crate) voter_id: Snowflake,
    pub(crate) email: String,
    pub(crate) voting_token: Option<Uuid>,
    pub(crate) has_voted: bool,
}

impl Voter {
    pub(crate) async fn create_many(
        voter_ids: &[Snowflake],
        emails: &[String],
        campaign_id: Snowflake,
        pool: &PgPool,
    ) -> Result<(), ChainsawError> {
        sqlx::query!(
            r#"
            INSERT INTO campaign_voters (voter_id, email, campaign_id)
            SELECT v, e, $3
            FROM UNNEST($1::bigint[], $2::text[]) AS t(v, e)
            "#,
            &voter_ids.iter().map(|id| id.get()).collect::<Vec<i64>>(),
            emails,
            campaign_id.get()
        )
        .execute(pool)
        .await?;

        Ok(())
    }

    pub(crate) async fn get_all(
        campaign_id: Snowflake,
        pool: &PgPool,
    ) -> Result<Vec<Self>, ChainsawError> {
        Ok(sqlx::query_as!(
            Voter,
            r#"
            SELECT voter_id, email, voting_token, has_voted
            FROM campaign_voters
            WHERE campaign_id = $1
            "#,
            campaign_id.get()
        )
        .fetch_all(pool)
        .await?)
    }

    pub(crate) async fn delete_many(
        voter_ids: &[Snowflake],
        campaign_id: Snowflake,
        pool: &PgPool,
    ) -> Result<(), ChainsawError> {
        sqlx::query!(
            r#"
            DELETE FROM campaign_voters
            WHERE campaign_id = $1 AND voter_id = ANY($2)
            "#,
            campaign_id.get(),
            &voter_ids.iter().map(|id| id.get()).collect::<Vec<i64>>()
        )
        .execute(pool)
        .await?;

        Ok(())
    }

    pub(crate) async fn invite_pending(
        campaign_id: Snowflake,
        pool: &PgPool,
    ) -> Result<Vec<(Snowflake, Uuid)>, ChainsawError> {
        let mut tx = pool.begin().await?;
        // TODO: Is skip locked safe/good here?
        let voter_ids = sqlx::query_scalar::<_, i64>(
            r#"
            SELECT voter_id
            FROM campaign_voters
            WHERE campaign_id = $1 AND voting_token IS NULL
            FOR UPDATE SKIP LOCKED
            "#,
        )
        .bind(campaign_id.get())
        .fetch_all(&mut *tx)
        .await?;

        let voting_tokens = voter_ids.iter().map(|_| Uuid::new_v4()).collect::<Vec<_>>();

        sqlx::query!(
            r#"
            UPDATE campaign_voters AS voter
            SET voting_token = invitation.voting_token
            FROM UNNEST($1::bigint[], $2::uuid[]) AS invitation(voter_id, voting_token)
            WHERE voter.voter_id = invitation.voter_id
                AND voter.campaign_id = $3
                AND voter.voting_token IS NULL
            "#,
            &voter_ids,
            &voting_tokens,
            campaign_id.get()
        )
        .execute(&mut *tx)
        .await?;

        tx.commit().await?;

        Ok(voter_ids
            .into_iter()
            .zip(voting_tokens)
            .map(|(voter_id, voting_token)| (voter_id.into(), voting_token))
            .collect())
    }
}

#[derive(Serialize)]
pub(crate) struct VoterResponse {
    pub(crate) voter_id: Snowflake,
    pub(crate) email: String,
    pub(crate) status: VoterStatus,
}

#[derive(Serialize)]
pub(crate) enum VoterStatus {
    #[serde(rename = "pending")]
    Pending,
    #[serde(rename = "invited")]
    Invited,
    #[serde(rename = "voted")]
    Voted,
}

#[derive(Deserialize)]
pub(crate) struct VoterEmails {
    pub(crate) emails: Vec<String>,
}

impl VoterEmails {
    pub(crate) fn emails_are_valid(&self) -> bool {
        is_non_empty_unique(&self.emails)
    }
}

#[derive(Deserialize)]
pub(crate) struct VoterIds {
    pub(crate) voter_ids: Vec<Snowflake>,
}

impl VoterIds {
    pub(crate) fn voter_ids_are_valid(&self) -> bool {
        is_non_empty_unique(&self.voter_ids)
    }
}
