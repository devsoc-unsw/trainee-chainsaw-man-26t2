use crate::snowflake::Snowflake;
use rand::rngs::{StdRng, SysRng};
use rand::{RngExt, SeedableRng};
use std::collections::{HashMap, HashSet};

pub(crate) struct IrvBallot {
    pub(crate) candidates: Vec<Snowflake>,
}

pub(crate) struct IrvRound {
    pub(crate) candidate_votes: HashMap<Snowflake, u32>,
    pub(crate) eliminated_candidate: Snowflake,
}

pub(crate) struct IrvResult {
    pub(crate) winners: Vec<Snowflake>,
    pub(crate) rounds: Vec<IrvRound>,
}

pub(crate) fn irv_count(
    ballots: &Vec<IrvBallot>,
    allowed_candidates: &HashSet<Snowflake>,
    num_winners: usize,
) -> Option<IrvResult> {
    let mut rounds = Vec::<IrvRound>::new();
    let mut remaining_candidates: HashSet<Snowflake> = allowed_candidates.clone();
    while remaining_candidates.len() > num_winners {
        let mut candidate_votes = HashMap::new();
        for ballot in ballots {
            if let Some(candidate) = ballot
                .candidates
                .iter()
                .find(|c| remaining_candidates.contains(c))
            {
                *candidate_votes.entry(*candidate).or_insert(0) += 1;
            }
        }

        // Sort candidates by least votes (keep the votes so we can check for multiple ties)
        let mut sorted_candidates: Vec<_> = candidate_votes.iter().collect();
        sorted_candidates.sort_by_key(|&(_, &votes)| votes);

        // Find the candidate(s) with the least votes
        let least_votes = sorted_candidates.first().map(|&(_, &votes)| votes).unwrap();
        let mut candidates_with_least_votes: Vec<_> = sorted_candidates
            .iter()
            .filter(|&&(_, &votes)| votes == least_votes)
            .map(|&(candidate, _)| *candidate)
            .collect();

        let mut eliminated_candidate = None;
        if candidates_with_least_votes.len() > 1 {
            // Go back through previous rounds to see which candidate has the least votes in previous rounds
            for round in rounds.iter().rev() {
                let mut previous_least_votes = u32::MAX;
                let mut previous_candidates_with_least_votes = Vec::new();

                for &candidate in &candidates_with_least_votes {
                    if let Some(&votes) = round.candidate_votes.get(&candidate) {
                        if votes < previous_least_votes {
                            previous_least_votes = votes;
                            previous_candidates_with_least_votes.clear();
                            previous_candidates_with_least_votes.push(candidate);
                        } else if votes == previous_least_votes {
                            previous_candidates_with_least_votes.push(candidate);
                        }
                    }
                }

                // If we have found a single candidate with the least votes, we can eliminate them
                if previous_candidates_with_least_votes.len() == 1 {
                    eliminated_candidate = Some(previous_candidates_with_least_votes[0]);
                    break;
                }
                // Otherwise, continue to the next previous round with the candidates that are still tied
                candidates_with_least_votes = previous_candidates_with_least_votes;
            }
        } else {
            eliminated_candidate = Some(candidates_with_least_votes[0]);
        }

        if eliminated_candidate.is_none() {
            // We have a tie even when we go back rounds
            // This is resolved by a random number generator
            let mut rng = StdRng::try_from_rng(&mut SysRng).unwrap();
            let random_index = rng.random_range(0..candidates_with_least_votes.len());
            eliminated_candidate = Some(candidates_with_least_votes[random_index]);
        }

        rounds.push(IrvRound {
            candidate_votes,
            eliminated_candidate: eliminated_candidate.unwrap(),
        });
        remaining_candidates.remove(&eliminated_candidate.unwrap());
    }

    Some(IrvResult {
        winners: remaining_candidates.iter().cloned().collect(),
        rounds,
    })
}

pub(crate) struct FptpBallot {
    pub(crate) candidate: HashSet<Snowflake>,
}

pub(crate) struct FptpResult {
    pub(crate) winners: Vec<Snowflake>,
    pub(crate) candidate_votes: HashMap<Snowflake, u32>,
    pub(crate) tied_candidates: Vec<Snowflake>,
}

pub(crate) fn fptp_count(ballots: &Vec<FptpBallot>, num_winners: usize) -> Option<FptpResult> {
    let mut candidate_votes = HashMap::new();
    for ballot in ballots {
        for candidate in &ballot.candidate {
            *candidate_votes.entry(*candidate).or_insert(0) += 1;
        }
    }

    // Sort candidates by most votes (identify ties)
    let mut sorted_candidates: Vec<_> = candidate_votes.iter().collect();
    sorted_candidates.sort_by_key(|&(_, &votes)| std::cmp::Reverse(votes));

    // Pull the top candidates, but check for ties at the last position
    let mut winners = Vec::new();
    let mut tied_candidates = Vec::new();
    let mut last_votes = None;
    for (i, &(candidate, &votes)) in sorted_candidates.iter().enumerate() {
        if i < num_winners {
            winners.push(*candidate);
            if let Some(last) = last_votes
                && votes != last
            {
                tied_candidates.clear();
            }
            last_votes = Some(votes);
            tied_candidates.push(*candidate);
        } else if Some(votes) == last_votes {
            winners.push(*candidate);
            tied_candidates.push(*candidate);
        } else {
            break;
        }
    }

    Some(FptpResult {
        winners,
        candidate_votes,
        tied_candidates,
    })
}
