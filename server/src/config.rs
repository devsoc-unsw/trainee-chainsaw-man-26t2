use clap::Parser;

/// The read configuration for the application.
#[derive(Parser)]
pub struct Config {
    /// The connection URL for the Postgres database this application should use.
    #[arg(long, env)]
    pub database_url: String,
}
