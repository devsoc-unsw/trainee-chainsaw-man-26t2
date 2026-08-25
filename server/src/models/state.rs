use crate::config::Config;
use crate::snowflake::SnowflakeGen;
use axum::extract::FromRef;
use sqlx::PgPool;
use std::sync::Arc;

/// The base state accepted by all routes across the backend.
#[derive(Clone)]
#[allow(dead_code)] // TODO: Remove this once the API is implemented
pub(crate) struct BaseState {
    pub config: Arc<Config>,
    pub db: PgPool,
    pub id_gen: SnowflakeGen,
}

impl BaseState {
    pub(crate) fn new(config: Config, db: PgPool, id_gen: SnowflakeGen) -> Self {
        BaseState {
            config: Arc::new(config),
            db,
            id_gen,
        }
    }
}

/// The core type through which handler functions can access common API state.
#[derive(Clone)]
pub(crate) struct ApiState {
    base: BaseState,
}

impl ApiState {
    pub(crate) fn new(config: Config, db: PgPool, id_gen: SnowflakeGen) -> Self {
        ApiState {
            base: BaseState::new(config, db, id_gen),
        }
    }
}

impl FromRef<ApiState> for BaseState {
    fn from_ref(input: &ApiState) -> Self {
        input.base.clone()
    }
}
