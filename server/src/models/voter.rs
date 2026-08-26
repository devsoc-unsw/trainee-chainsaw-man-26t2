use crate::snowflake::Snowflake;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Deserialize, Serialize)]
pub(crate) struct Voter {
    pub(crate) voter_id: Snowflake,
    pub(crate) email: String,
    pub(crate) voting_token: Option<Uuid>,
    pub(crate) has_voted: bool,
}

#[derive(Serialize)]
pub(crate) struct VoterResponse {
    pub(crate) voter_id: Snowflake,
    pub(crate) email: String,
    pub(crate) status: VoterStatus,
}

#[derive(Serialize)]
pub(crate) enum VoterStatus {
    #[serde(rename = "pending")]
    Pending,
    #[serde(rename = "invited")]
    Invited,
    #[serde(rename = "voted")]
    Voted,
}

#[derive(Deserialize)]
pub(crate) struct VoterEmails {
    pub(crate) emails: Vec<String>,
}

#[derive(Deserialize)]
pub(crate) struct VoterIds {
    pub(crate) voter_ids: Vec<Snowflake>,
}
