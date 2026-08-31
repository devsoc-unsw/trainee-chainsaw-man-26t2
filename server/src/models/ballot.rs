use crate::snowflake::Snowflake;
use chrono::{DateTime, Utc};

pub(crate) struct EmptyBallot {
    pub(crate) campaign_id: Snowflake,
    pub(crate) title: String,
    pub(crate) description: String,
    pub(crate) opening_date_time: DateTime<Utc>,
    pub(crate) closing_date_time: DateTime<Utc>,
    pub(crate) roles: Vec<BallotRole>,
}

pub(crate) struct BallotRole {
    pub(crate) role_id: Snowflake,
    pub(crate) title: String,
    pub(crate) description: String,
    pub(crate) no_of_positions: i32,
    pub(crate) enable_abstention: bool,
    pub(crate) candidates: Vec<BallotCandidate>,
}

pub(crate) struct BallotCandidate {
    pub(crate) candidate_id: Snowflake,
    pub(crate) first_name: String,
    pub(crate) last_name: String,
    pub(crate) manifesto: Option<String>,
}
