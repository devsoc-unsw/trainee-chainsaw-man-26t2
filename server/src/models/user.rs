use crate::snowflake::Snowflake;
use serde::Serialize;

#[derive(sqlx::FromRow, Serialize)]
pub(crate) struct User {
    pub(crate) user_id: Snowflake,
    pub(crate) email: String,
}
