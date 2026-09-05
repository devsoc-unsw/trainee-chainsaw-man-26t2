use crate::snowflake::Snowflake;
use anyhow::Error;
use async_trait::async_trait;
use axum_session_auth::Authentication;
use serde::Serialize;
use sqlx::PgPool;

#[derive(sqlx::FromRow, Serialize, Clone)]
pub(crate) struct User {
    pub(crate) user_id: Snowflake,
    pub(crate) email: String,
}

#[async_trait]
impl Authentication<User, Snowflake, PgPool> for User {
    async fn load_user(userid: Snowflake, pool: Option<&PgPool>) -> Result<User, Error> {
        // TODO: Actually load the user from the database.
        Ok(Self {
            user_id: userid,
            email: String::from("meow@gmail.com"),
        })
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
