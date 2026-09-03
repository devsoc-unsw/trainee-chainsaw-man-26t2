import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/Card";
import { ElectionResults } from "@/components/ElectionResults";
import type { ElectionResults as Results } from "@/components/ElectionResults";


export const Route = createFileRoute("/count/$electionId")({
  component: RouteComponent,
});

interface PublicResults {
  title: string;
  results: Results;
}

// TODO: delete between TODO lines since just for testing
async function fetchPublicResults(campaignId: string): Promise<PublicResults> {
  await new Promise((r) => setTimeout(r, 200));
  console.log("fetchPublicResults", campaignId);
  return {
    title: "2026 Executive Election",
    results: {
      campaign_id: campaignId,
      roles: [
        {
          role_id: "1",
          title: "Co-President",
          winners: [{ candidate_id: "3", first_name: "Priya", last_name: "Nair" }],
        },
        {
          role_id: "2",
          title: "Secretary",
          winners: [{ candidate_id: "5", first_name: "Tom", last_name: "Okafor" }],
        },
      ],
    },
  };
}
// TODO

// TODO: uncomment following with query
/*
async function fetchPublicResults(campaignId: string): Promise<PublicResults> {
  const res = await fetch(`/campaigns/${campaignId}/results/public`);
  if (res.status === 409) throw new Error("Results aren't available until voting closes.");
  if (!res.ok) throw new Error("Couldn't load results.");
  return res.json();
}
*/

function RouteComponent() {
  const { electionId } = Route.useParams();
  const [data, setData] = useState<PublicResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPublicResults(electionId)
      .then(setData)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Couldn't load results."),
      );
  }, [electionId]);

  const countsHidden =
    data !== null && data.results.roles.every((role) => role.rounds === undefined);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5 px-6 py-8">
      <header className="flex items-baseline gap-4">
        <h1 className="text-4xl font-bold text-on-dark">Results</h1>
        {data && <p className="text-lg font-semibold text-on-dark">{data.title}</p>}
      </header>

      {error ? (
        <Card className="p-6">
          <p className="text-center text-xs text-muted/60">{error}</p>
        </Card>
      ) : !data ? (
        <p className="text-xs text-on-dark/60">Loading…</p>
      ) : (
        <>
          <ElectionResults results={data.results} />
          {countsHidden && (
            <p className="text-xs text-on-dark/60">
              The organiser hasn't published the vote counts for this election.
            </p>
          )}
        </>
      )}
    </div>
  );
}
