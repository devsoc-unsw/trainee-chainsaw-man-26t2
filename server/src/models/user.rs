use crate::models::error::ChainsawError;
use crate::snowflake::{Snowflake, SnowflakeGen};
use anyhow::{Context, Error};
use async_trait::async_trait;
use axum_session_auth::Authentication;
use chrono::{DateTime, Utc};
use serde::Serialize;
use sqlx::PgPool;

#[derive(sqlx::FromRow, Serialize, Clone)]
pub(crate) struct User {
    pub(crate) user_id: Snowflake,
    pub(crate) email: Option<String>,
}

impl User {
    pub(crate) async fn create(
        email: Option<String>,
        id_gen: &SnowflakeGen,
        pool: &PgPool,
    ) -> Result<Snowflake, ChainsawError> {
        // Generate ID for user
        let user_id = id_gen.generate().await;

        // Insert user into database
        sqlx::query!(
            r#"
            INSERT INTO "users"
            (user_id, email)
            VALUES ($1, $2)
            "#,
            user_id.get(),
            email
        )
        .execute(pool)
        .await?;

        // Return user ID
        Ok(user_id)
    }

    pub(crate) async fn get(
        user_id: Snowflake,
        pool: &PgPool,
    ) -> Result<Option<Self>, ChainsawError> {
        Ok(sqlx::query_as!(
            User,
            r#"SELECT * FROM "users" WHERE user_id = $1"#,
            user_id.get(),
        )
        .fetch_optional(pool)
        .await?)
    }
}

#[async_trait]
impl Authentication<User, Snowflake, PgPool> for User {
    async fn load_user(userid: Snowflake, pool: Option<&PgPool>) -> Result<User, Error> {
        Ok(Self::get(
            userid,
            pool.context("Couldn't get pg pool when loading user")?,
        )
        .await?
        .context("Couldn't find user with given ID.")?)
    }

    fn is_authenticated(&self) -> bool {
        self.user_id != Snowflake::default()
    }

    fn is_active(&self) -> bool {
        self.user_id != Snowflake::default()
    }

    fn is_anonymous(&self) -> bool {
        self.user_id == Snowflake::default()
    }
}
