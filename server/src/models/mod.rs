pub(crate) mod ballot;
pub(crate) mod campaign;
pub(crate) mod candidate;
pub(crate) mod counting;
pub(crate) mod error;
pub(crate) mod role;
pub(crate) mod state;
pub(crate) mod voter;

use std::collections::HashSet;
use std::hash::Hash;

fn is_non_empty_unique<T: Eq + Hash>(items: &[T]) -> bool {
    !items.is_empty() && items.iter().collect::<HashSet<_>>().len() == items.len()
}
