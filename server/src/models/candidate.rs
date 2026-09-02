use crate::models::error::ChainsawError;
use crate::snowflake::{Snowflake, SnowflakeGen, SnowflakeIds};
use crate::utils::is_non_empty_unique;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use sqlx::prelude::FromRow;

#[derive(FromRow, Deserialize, Serialize)]
pub(crate) struct Candidate {
    pub(crate) candidate_id: Snowflake,
    pub(crate) first_name: String,
    pub(crate) last_name: String,
    pub(crate) email: String,
    pub(crate) manifesto: Option<String>,
    pub(crate) role_ids: SnowflakeIds,
}

impl Candidate {
    #[allow(clippy::too_many_arguments)]
    pub(crate) async fn create(
        first_name: String,
        last_name: String,
        email: String,
        manifesto: Option<String>,
        campaign_id: Snowflake,
        role_ids: &[Snowflake],
        id_gen: &SnowflakeGen,
        pool: &PgPool,
    ) -> Result<Snowflake, ChainsawError> {
        let mut tx = pool.begin().await?;
        let candidate_id = id_gen.generate().await;

        // TODO: Give nice error if campaign does not exist
        sqlx::query!(
            r#"
            INSERT INTO "candidates"
            (candidate_id, campaign_id, first_name, last_name, email, manifesto)
            VALUES ($1, $2, $3, $4, $5, $6)
            "#,
            candidate_id.get(),
            campaign_id.get(),
            first_name,
            last_name,
            email,
            manifesto
        )
        .execute(&mut *tx)
        .await?;

        // TODO: Give nice error if role does not exist
        for role_id in role_ids {
            sqlx::query!(
                r#"INSERT INTO "candidate_roles" (candidate_id, role_id, campaign_id) VALUES ($1, $2, $3)"#,
                candidate_id.get(),
                role_id.get(),
                campaign_id.get()
            )
            .execute(&mut *tx)
            .await?;
        }

        tx.commit().await?;
        Ok(candidate_id)
    }
}

#[derive(Deserialize)]
pub(crate) struct CreateCandidate {
    pub first_name: String,
    pub last_name: String,
    pub email: String,
    pub manifesto: Option<String>,
    pub role_ids: Vec<Snowflake>,
}

impl CreateCandidate {
    pub(crate) fn role_ids_are_valid(&self) -> bool {
        is_non_empty_unique(&self.role_ids)
    }
}

#[derive(Deserialize)]
pub(crate) struct UpdateCandidate {
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub email: Option<String>,
    pub manifesto: Option<String>,
    pub role_ids: Option<Vec<Snowflake>>,
}

impl UpdateCandidate {
    pub(crate) fn is_empty(&self) -> bool {
        self.first_name.is_none()
            && self.last_name.is_none()
            && self.email.is_none()
            && self.manifesto.is_none()
            && self.role_ids.is_none()
    }

    pub(crate) fn role_ids_are_valid(&self) -> bool {
        self.role_ids.as_deref().is_none_or(is_non_empty_unique)
    }
}
