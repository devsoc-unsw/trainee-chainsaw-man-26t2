use chrono::Utc;
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use std::fmt::{Debug, Display, Formatter};
use std::str::FromStr;
use std::sync::Arc;
use tokio::sync::Mutex;

/// The Chainsaw epoch (in milliseconds), from which all timestamps are derived.
/// This is midnight on the 01/01/2026, in UTC.
const CHAINSAW_EPOCH: i64 = 1767225600000;

/// Get the time elapsed in milliseconds since the Chainsaw Epoch.
pub fn time_since_epoch() -> i64 {
    Utc::now().timestamp_millis() - CHAINSAW_EPOCH
}

/// A snowflake ID.
///
/// Format:
/// - The first bit is always a 0.
/// - The next 42 bits represent the number of milliseconds since the Chainsaw epoch.
/// - The next 9 bits represent the worker ID of the snowflake generator.
/// - The next 12 bits represent an auto-incrementing tail ID for the generator.
#[derive(Copy, Clone, Debug, Eq, PartialEq, Ord, PartialOrd, Hash, Default)]
pub struct Snowflake(i64);

impl Snowflake {
    /// Get the underlying ID for this snowflake.
    pub fn get(self) -> i64 {
        self.0
    }

    /// Get the UNIX timestamp (in milliseconds) at which this snowflake was created.
    pub fn timestamp(self) -> i64 {
        // Get millisecond timestamp from ID
        let milliseconds_since_epoch = self.get() >> 21;

        // Add to epoch, and return
        CHAINSAW_EPOCH + milliseconds_since_epoch
    }
}
impl Display for Snowflake {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        Display::fmt(&self.0, f)
    }
}

impl From<i64> for Snowflake {
    fn from(value: i64) -> Self {
        Self(value)
    }
}

impl Serialize for Snowflake {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&self.0.to_string())
    }
}

impl<'de> Deserialize<'de> for Snowflake {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let string_id = <&str>::deserialize(deserializer)?;
        let parsed_id = i64::from_str(string_id).map_err(serde::de::Error::custom)?;
        Ok(Self(parsed_id))
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(transparent)]
pub struct SnowflakeIds(pub Vec<Snowflake>);

impl From<Vec<i64>> for SnowflakeIds {
    fn from(ids: Vec<i64>) -> Self {
        Self(ids.into_iter().map(Snowflake::from).collect())
    }
}

impl From<SnowflakeIds> for Vec<i64> {
    fn from(ids: SnowflakeIds) -> Self {
        ids.0.into_iter().map(Snowflake::get).collect()
    }
}

/// A generator for snowflakes.
#[derive(Clone)]
pub struct SnowflakeGen {
    /// The worker ID for this generator. This is centrally allocated globally.
    worker_id: u16,

    /// The current sequence number for this generator. Goes up to 4095 and then wraps around.
    current_seq: Arc<Mutex<u16>>,
}

impl SnowflakeGen {
    /// Create a new snowflake generator using a provided worker ID.
    pub fn new(worker_id: u16) -> Self {
        Self {
            worker_id,
            current_seq: Arc::new(Mutex::new(0)),
        }
    }

    /// Atomically increment the current sequence number, returning the previous value.
    async fn increment_seq(&self) -> u16 {
        // Obtain lock for current ID
        let mut current_id = self.current_seq.lock().await;

        // Store current value
        let locked_id = *current_id;

        // Increment current ID
        *current_id += 1;
        if *current_id >= 4096 {
            *current_id = 0;
        }

        // Return locked ID
        locked_id
    }

    /// Generate a new snowflake using this generator.
    pub async fn generate(&self) -> Snowflake {
        // Get sequence number
        let seq = self.increment_seq().await;

        // Construct snowflake ID
        let mut snowflake_id: i64 = 0;
        snowflake_id |= (time_since_epoch() & 0x3FFFFFFFFFF) << 21;
        snowflake_id |= (i64::from(self.worker_id) & 0x1FF) << 12;
        snowflake_id |= i64::from(seq) & 0xFFF;

        // Return new snowflake
        Snowflake::from(snowflake_id)
    }
}
