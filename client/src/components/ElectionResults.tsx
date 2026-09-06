import { Card } from "@/components/Card";

export interface ResultCandidate {
    candidate_id: string;
    first_name: string;
    last_name: string;
}

export interface CandidateVoteTotal {
    candidate_id: string;
    votes: number;
}

export interface ResultRound {
    candidate_totals: CandidateVoteTotal[];
    eliminated_candidate_id?: string;
    elected_candidate_ids?: string[];
    exhausted_ballots: number;
}

export interface RoleResult {
    role_id: string;
    title: string;
    winners: ResultCandidate[];
    // Absent when publicise result is toggled off
    rounds?: ResultRound[];
}

export interface ElectionResults {
    campaign_id: string;
    roles: RoleResult[];
}

function fullName(candidate: ResultCandidate) {
    return `${candidate.first_name} ${candidate.last_name}`;
}

export function ElectionResults({ results }: { results: ElectionResults }) {
    return (
        <div className="w-full space-y-3">
            {results.roles.map((role) => (
                <RoleCard key={role.role_id} role={role} />
            ))}
        </div>
    );
}

function RoleCard({ role }: { role: RoleResult }) {
    const names = new Map<string, string>();
    for (const winner of role.winners) {
        names.set(winner.candidate_id, fullName(winner));
    }

    const hasCounts = role.rounds !== undefined && role.rounds.length > 0;

    return (
        <Card className="p-6">
            <p className="text-xs uppercase tracking-wide text-muted/60">{role.title}</p>

            {role.winners.length === 0 ? (
                <p className="mt-2 text-lg text-muted/60">No winner</p>
            ) : (
                <div className="mt-3 space-y-2">
                    {role.winners.map((winner) => (
                        <div key={winner.candidate_id} className="flex items-center gap-3">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-progress/20">
                                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                                    <path
                                        d="M5 13l4 4L19 7"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="text-progress"
                                    />
                                </svg>
                            </span>
                            <span className="text-2xl font-bold">{fullName(winner)}</span>
                        </div>
                    ))}
                </div>
            )}

            {hasCounts && (
                <div className="mt-6 border-t border-muted/20 pt-5">
                    <Rounds rounds={role.rounds!} names={names} />
                </div>
            )}
        </Card>
    );
}

function Rounds({
    rounds,
    names,
}: {
    rounds: ResultRound[];
    names: Map<string, string>;
}) {
    const winnerIds = new Set(
        rounds.flatMap((round) => round.elected_candidate_ids ?? []),
    );

    if (rounds.length === 1) {
        return <RoundTable round={rounds[0]} names={names} winnerIds={winnerIds} />;
    }

    return (
        <div className="space-y-5">
            {rounds.map((round, i) => (
                <div key={i}>
                    <p className="mb-2 text-xs text-muted/60">Round {i + 1}</p>
                    <RoundTable round={round} names={names} winnerIds={winnerIds} />
                </div>
            ))}
        </div>
    );
}

function RoundTable({
    round,
    names,
    winnerIds,
}: {
    round: ResultRound;
    names: Map<string, string>;
    winnerIds: Set<string>;
}) {
    const totals = [...round.candidate_totals].sort((a, b) => b.votes - a.votes);
    const highest = totals[0]?.votes ?? 0;

    return (
        <div className="space-y-1.5">
            {totals.map((total) => {
                const eliminated = round.eliminated_candidate_id === total.candidate_id;
                const won = winnerIds.has(total.candidate_id);

                return (
                    <div key={total.candidate_id} className="flex items-center gap-3">
                        <span
                            className={`w-28 shrink-0 truncate text-right text-xs ${eliminated ? "text-muted/50" : "text-neutral-800"}`}
                        >
                            {names.get(total.candidate_id) ?? `Candidate ${total.candidate_id}`}
                        </span>

                        <div className="flex min-w-0 flex-1 items-center gap-2">
                            <div
                                className={`h-2.5 rounded-sm ${won ? "bg-progress" : "bg-progress/25"}`}
                                style={{ width: `${highest === 0 ? 0 : (total.votes / highest) * 100}%` }}
                            />
                            <span
                                className={`shrink-0 text-xs tabular-nums ${eliminated ? "text-muted/50" : "text-neutral-800"
                                    }`}
                            >
                                {total.votes}
                            </span>
                        </div>
                    </div>
                );
            })}

            {round.exhausted_ballots > 0 && (
                <p className="pt-1 pl-31 text-xs text-muted/60">
                    {round.exhausted_ballots} exhausted{" "}
                    {round.exhausted_ballots === 1 ? "ballot" : "ballots"}
                </p>
            )}
        </div>
    );
}