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
