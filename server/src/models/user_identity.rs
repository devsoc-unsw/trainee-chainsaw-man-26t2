use crate::models::error::ChainsawError;
use crate::snowflake::Snowflake;
use serde::Serialize;
use sqlx::PgPool;

#[derive(sqlx::FromRow, Serialize, Clone)]
pub(crate) struct UserIdentity {
    pub(crate) provider: String,
    pub(crate) provider_id: String,
    pub(crate) user_id: Snowflake,
}

impl UserIdentity {
    pub(crate) async fn create(
        provider: String,
        provider_id: String,
        user_id: Snowflake,
        pool: &PgPool,
    ) -> Result<(), ChainsawError> {
        // Insert row into database
        sqlx::query!(
            r#"
            INSERT INTO "user_identities"
            (provider, provider_id, user_id)
            VALUES ($1, $2, $3)
            "#,
            provider,
            provider_id,
            user_id.get(),
        )
        .execute(pool)
        .await?;

        // Return Ok
        Ok(())
    }

    pub(crate) async fn get(
        provider: String,
        provider_id: String,
        pool: &PgPool,
    ) -> Result<Option<Self>, ChainsawError> {
        Ok(sqlx::query_as!(
            UserIdentity,
            r#"SELECT * FROM "user_identities" WHERE provider = $1 AND provider_id = $2"#,
            provider,
            provider_id
        )
        .fetch_optional(pool)
        .await?)
    }
}
