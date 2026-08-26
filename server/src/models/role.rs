use crate::models::error::ChainsawError;
use crate::snowflake::{Snowflake, SnowflakeGen};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

#[derive(sqlx::FromRow, Serialize)]
pub(crate) struct Role {
    pub(crate) role_id: i64,
    pub(crate) title: String,
    pub(crate) description: String,
    pub(crate) no_of_positions: i32,
    pub(crate) enable_abstention: bool,
}

impl Role {
    pub(crate) async fn create(
        title: String,
        description: String,
        no_of_positions: i32,
        enable_abstention: bool,
        campaign_id: i64,
        id_gen: &SnowflakeGen,
        pool: &PgPool,
    ) -> Result<Snowflake, ChainsawError> {
        let role_id = id_gen.generate().await;

        sqlx::query!(
            r#"
            INSERT INTO "campaign_roles"
            (role_id, campaign_id, title, description, no_of_positions, enable_abstention)
            VALUES ($1, $2, $3, $4, $5, $6)
            "#,
            role_id.get(),
            campaign_id,
            title,
            description,
            no_of_positions,
            enable_abstention
        )
        .execute(pool)
        .await?;

        Ok(role_id)
    }
}

#[derive(Deserialize)]
pub(crate) struct CreateRole {
    pub(crate) title: String,
    pub(crate) description: String,
    pub(crate) no_of_positions: i32,
    pub(crate) enable_abstention: bool,
}

#[derive(Deserialize)]
pub(crate) struct UpdateRole {
    pub(crate) title: Option<String>,
    pub(crate) description: Option<String>,
    pub(crate) no_of_positions: Option<i32>,
    pub(crate) enable_abstention: Option<bool>,
}
