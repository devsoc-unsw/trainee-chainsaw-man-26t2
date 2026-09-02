use crate::models::error::ChainsawError;
use crate::snowflake::{Snowflake, SnowflakeGen};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, PgPool};

#[derive(FromRow, Deserialize, Serialize)]
pub(crate) struct Campaign {
    pub(crate) campaign_id: Snowflake,
    pub(crate) title: String,
    pub(crate) description: String,
    pub(crate) opening_date_time: DateTime<Utc>,
    pub(crate) closing_date_time: DateTime<Utc>,
    pub(crate) allow_role_overlaps: bool,
}

impl Campaign {
    pub(crate) async fn create(
        title: String,
        description: String,
        opening_date_time: DateTime<Utc>,
        closing_date_time: DateTime<Utc>,
        allow_role_overlaps: bool,
        id_gen: &SnowflakeGen,
        pool: &PgPool,
    ) -> Result<Snowflake, ChainsawError> {
        // Generate ID for campaign
        let campaign_id = id_gen.generate().await;

        // Insert campaign into database
        sqlx::query!(
            r#"
            INSERT INTO "campaigns"
            (campaign_id, title, description, opening_date_time, closing_date_time, allow_role_overlaps)
            VALUES ($1, $2, $3, $4, $5, $6)
            "#,
            campaign_id.get(),
            title,
            description,
            opening_date_time,
            closing_date_time,
            allow_role_overlaps
        ).execute(pool).await?;

        // Return campaign ID
        Ok(campaign_id)
    }

    pub(crate) async fn get_all(pool: &PgPool) -> Result<Vec<Self>, ChainsawError> {
        Ok(sqlx::query_as!(Campaign, r#"SELECT * FROM "campaigns""#)
            .fetch_all(pool)
            .await?)
    }

    pub(crate) async fn get(
        campaign_id: Snowflake,
        pool: &PgPool,
    ) -> Result<Option<Self>, ChainsawError> {
        Ok(sqlx::query_as!(
            Campaign,
            r#"SELECT * FROM "campaigns" WHERE campaign_id = $1"#,
            campaign_id.get(),
        )
        .fetch_optional(pool)
        .await?)
    }

    pub(crate) async fn exists(
        campaign_id: Snowflake,
        pool: &PgPool,
    ) -> Result<bool, ChainsawError> {
        Ok(sqlx::query_scalar::<_, bool>(
            r#"SELECT EXISTS(SELECT 1 FROM "campaigns" WHERE campaign_id = $1)"#,
        )
        .bind(campaign_id.get())
        .fetch_one(pool)
        .await?)
    }

    pub(crate) async fn update(
        campaign_id: Snowflake,
        data: UpdateCampaign,
        pool: &PgPool,
    ) -> Result<(), ChainsawError> {
        let result = sqlx::query!(
            r#"
            UPDATE "campaigns"
            SET
                title = COALESCE($1, title),
                description = COALESCE($2, description),
                opening_date_time = COALESCE($3, opening_date_time),
                closing_date_time = COALESCE($4, closing_date_time),
                allow_role_overlaps = COALESCE($5, allow_role_overlaps)
            WHERE campaign_id = $6
            "#,
            data.title,
            data.description,
            data.opening_date_time,
            data.closing_date_time,
            data.allow_role_overlaps,
            campaign_id.get(),
        )
        .execute(pool)
        .await?;

        if result.rows_affected() == 0 {
            return Err(ChainsawError::CampaignNotFound);
        }

        Ok(())
    }

    pub(crate) async fn delete(campaign_id: Snowflake, pool: &PgPool) -> Result<(), ChainsawError> {
        let result = sqlx::query!(
            r#"DELETE FROM "campaigns" WHERE campaign_id = $1"#,
            campaign_id.get(),
        )
        .execute(pool)
        .await?;

        if result.rows_affected() == 0 {
            return Err(ChainsawError::CampaignNotFound);
        }

        Ok(())
    }
}

#[derive(Deserialize)]
pub(crate) struct CreateCampaign {
    pub title: String,
    pub description: String,
    pub opening_date_time: DateTime<Utc>,
    pub closing_date_time: DateTime<Utc>,
    pub allow_role_overlaps: bool,
}

#[derive(Deserialize)]
pub(crate) struct UpdateCampaign {
    pub title: Option<String>,
    pub description: Option<String>,
    pub opening_date_time: Option<DateTime<Utc>>,
    pub closing_date_time: Option<DateTime<Utc>>,
    pub allow_role_overlaps: Option<bool>,
}

impl UpdateCampaign {
    pub(crate) fn is_empty(&self) -> bool {
        self.title.is_none()
            && self.description.is_none()
            && self.opening_date_time.is_none()
            && self.closing_date_time.is_none()
            && self.allow_role_overlaps.is_none()
    }
}
