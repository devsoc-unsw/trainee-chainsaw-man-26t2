use crate::models::error::ChainsawError;
use crate::snowflake::{Snowflake, SnowflakeGen};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use sqlx::prelude::FromRow;

#[derive(FromRow, Deserialize, Serialize)]
pub(crate) struct Candidate {
    pub(crate) candidate_id: i64,
    pub(crate) first_name: String,
    pub(crate) last_name: String,
    pub(crate) email: String,
    pub(crate) manifesto: Option<String>,
    pub(crate) role_ids: Vec<i64>,
}

impl Candidate {
    pub(crate) async fn create(
        first_name: String,
        last_name: String,
        email: String,
        manifesto: Option<String>,
        campaign_id: i64,
        role_ids: &[i64],
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
            campaign_id,
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
                role_id,
                campaign_id
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
    pub role_ids: Vec<i64>,
}

#[derive(Deserialize)]
pub(crate) struct UpdateCandidate {
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub email: Option<String>,
    pub manifesto: Option<String>,
    pub role_ids: Option<Vec<i64>>,
}
