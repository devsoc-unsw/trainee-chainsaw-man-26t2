import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/Card";
import { ElectionResults } from "@/components/ElectionResults";
import type { ElectionResults as Results } from "@/components/ElectionResults";

export const Route = createFileRoute("/_authed/elections/$electionId/results")({
    component: RouteComponent,
});

interface ResultsPage {
    title: string;
    results: Results;
}

// TODO: delete between TODO lines since just for testing
const MOCK: ResultsPage = {
    title: "2026 Executive EGM",
    results: {
        campaign_id: "1",
        roles: [
            {
                role_id: "1",
                title: "Co-President",
                winners: [{ candidate_id: "3", first_name: "Makima", last_name: "Nakamura" }],
                rounds: [
                    {
                        candidate_totals: [
                            { candidate_id: "1", votes: 34 },
                            { candidate_id: "2", votes: 28 },
                            { candidate_id: "3", votes: 41 },
                        ],
                        eliminated_candidate_id: "2",
                        exhausted_ballots: 0,
                    },
                    {
                        candidate_totals: [
                            { candidate_id: "1", votes: 45 },
                            { candidate_id: "3", votes: 55 },
                        ],
                        elected_candidate_ids: ["3"],
                        exhausted_ballots: 3,
                    },
                ],
            },
            {
                role_id: "2",
                title: "Secretary",
                winners: [{ candidate_id: "5", first_name: "Power", last_name: "Hayakawa" }],
                rounds: [
                    {
                        candidate_totals: [
                            { candidate_id: "4", votes: 39 },
                            { candidate_id: "5", votes: 64 },
                        ],
                        elected_candidate_ids: ["5"],
                        exhausted_ballots: 0,
                    },
                ],
            },
        ],
    },
};

async function fetchResultsPage(campaignId: string): Promise<ResultsPage> {
    await new Promise((r) => setTimeout(r, 200));
    console.log("fetchResultsPage", campaignId);
    return MOCK;
}
// TODO

// TODO: uncomment following with query
/*
async function fetchResultsPage(campaignId: string): Promise<ResultsPage> {
  const [campaignRes, resultsRes] = await Promise.all([
    fetch(`/campaigns/${campaignId}`),
    fetch(`/campaigns/${campaignId}/results`),
  ]);

  if (!campaignRes.ok) throw new Error("Couldn't load this election.");
  if (resultsRes.status === 409) throw new Error("Results aren't available until voting closes.");
  if (!resultsRes.ok) throw new Error("Couldn't load results.");

  const campaign = await campaignRes.json();
  return { title: campaign.title, results: await resultsRes.json() };
}
*/

function RouteComponent() {
    const { electionId } = Route.useParams();
    const [page, setPage] = useState<ResultsPage | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchResultsPage(electionId)
            .then(setPage)
            .catch((err: unknown) =>
                setError(err instanceof Error ? err.message : "Couldn't load results."),
            );
    }, [electionId]);

    return (
        <div className="w-full space-y-3">
            <header className="flex items-baseline gap-4">
                <h1 className="text-4xl font-bold text-on-dark">Results</h1>
                {page && <p className="text-lg font-semibold text-on-dark">{page.title}</p>}
            </header>

            {error ? (
                <Card className="p-6">
                    <p className="text-center text-xs text-muted/60">{error}</p>
                </Card>
            ) : !page ? (
                <p className="text-xs text-on-dark/60">Loading…</p>
            ) : (
                <>
                    <ElectionResults results={page.results} />

                    <Card className="p-3">
                        {/* TODO: replace with actual backend stuff */}
                        <button type="button" className="w-full rounded-lg bg-emphasis py-1.5 text-xs">
                            Export as CSV
                        </button>
                    </Card>
                </>
            )}
        </div>
    );
}