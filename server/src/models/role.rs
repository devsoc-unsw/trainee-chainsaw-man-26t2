use crate::models::error::ChainsawError;
use crate::snowflake::{Snowflake, SnowflakeGen};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

#[derive(sqlx::FromRow, Serialize)]
pub(crate) struct Role {
    pub(crate) role_id: Snowflake,
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
        campaign_id: Snowflake,
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
            campaign_id.get(),
            title,
            description,
            no_of_positions,
            enable_abstention
        )
        .execute(pool)
        .await?;

        Ok(role_id)
    }

    pub(crate) async fn get_all(
        campaign_id: Snowflake,
        pool: &PgPool,
    ) -> Result<Vec<Self>, ChainsawError> {
        Ok(sqlx::query_as!(
            Role,
            r#"SELECT
                role_id,
                title,
                description,
                no_of_positions,
                enable_abstention
            FROM "campaign_roles"
            WHERE campaign_id = $1"#,
            campaign_id.get()
        )
        .fetch_all(pool)
        .await?)
    }

    pub(crate) async fn get(
        campaign_id: Snowflake,
        role_id: Snowflake,
        pool: &PgPool,
    ) -> Result<Option<Self>, ChainsawError> {
        Ok(sqlx::query_as!(
            Role,
            r#"SELECT
                role_id,
                title,
                description,
                no_of_positions,
                enable_abstention
            FROM "campaign_roles"
            WHERE campaign_id = $1 AND role_id = $2"#,
            campaign_id.get(),
            role_id.get()
        )
        .fetch_optional(pool)
        .await?)
    }

    pub(crate) async fn update(
        campaign_id: Snowflake,
        role_id: Snowflake,
        data: UpdateRole,
        pool: &PgPool,
    ) -> Result<(), ChainsawError> {
        let result = sqlx::query!(
            r#"
            UPDATE "campaign_roles"
            SET
                title = COALESCE($1, title),
                description = COALESCE($2, description),
                no_of_positions = COALESCE($3, no_of_positions),
                enable_abstention = COALESCE($4, enable_abstention)
            WHERE campaign_id = $5 AND role_id = $6
            "#,
            data.title,
            data.description,
            data.no_of_positions,
            data.enable_abstention,
            campaign_id.get(),
            role_id.get()
        )
        .execute(pool)
        .await?;

        if result.rows_affected() == 0 {
            return Err(ChainsawError::RoleNotFound);
        }

        Ok(())
    }

    pub(crate) async fn delete(
        campaign_id: Snowflake,
        role_id: Snowflake,
        pool: &PgPool,
    ) -> Result<(), ChainsawError> {
        let result = sqlx::query!(
            r#"DELETE FROM "campaign_roles" WHERE campaign_id = $1 AND role_id = $2"#,
            campaign_id.get(),
            role_id.get()
        )
        .execute(pool)
        .await?;

        if result.rows_affected() == 0 {
            return Err(ChainsawError::RoleNotFound);
        }

        Ok(())
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

impl UpdateRole {
    pub(crate) fn is_empty(&self) -> bool {
        self.title.is_none()
            && self.description.is_none()
            && self.no_of_positions.is_none()
            && self.enable_abstention.is_none()
    }
}
