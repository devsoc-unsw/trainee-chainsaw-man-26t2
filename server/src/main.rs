use anyhow::{Context, Result};
use clap::Parser;
use server::config::Config;
use server::http;
use server::snowflake::SnowflakeGen;
use sqlx::postgres::PgPoolOptions;

#[tokio::main]
async fn main() -> Result<()> {
    // Load environment variables
    dotenvy::dotenv().ok();

    // Initialise logger
    env_logger::init();

    // Parse config from environment
    let config = Config::parse();

    // Initialise snowflake generator
    let id_gen = SnowflakeGen::new(123);

    // Create Postgres connection pool
    let db = PgPoolOptions::new()
        .max_connections(50)
        .connect(&config.database_url)
        .await
        .context("Could not connect to the database using database_url.")?;

    // Run database migrations
    sqlx::migrate!("./migrations").run(&db).await?;

    // Start server here
    http::serve(config, db, id_gen).await?;

    // Return Ok
    Ok(())
}
