use std::collections::HashSet;
use std::hash::Hash;

pub(crate) fn is_non_empty_unique<T: Eq + Hash>(items: &[T]) -> bool {
    !items.is_empty() && items.iter().collect::<HashSet<_>>().len() == items.len()
}
