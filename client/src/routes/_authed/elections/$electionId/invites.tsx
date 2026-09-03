import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/Card";
import { TextArea } from "@/components/Form";

interface Voter {
  voter_id: string;
  email: string;
  status: "pending" | "invited" | "voted";
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const STATUS_LABEL: Record<Voter["status"], string> = {
  pending: "Not invited",
  invited: "Invited",
  voted: "Voted",
};

const STATUS_CLASS: Record<Voter["status"], string> = {
  pending: "bg-muted/20 text-neutral-700",
  invited: "bg-blue/15 text-blue",
  voted: "bg-emphasis text-neutral-900",
};

// TODO: delete between TODO lines since just for testing
let mockVoterId = 100;

async function fetchVoters(campaignId: string): Promise<Voter[]> {
  await new Promise((r) => setTimeout(r, 200));
  console.log("fetchVoters", campaignId);
  return [
    { voter_id: "1", email: "amelia.chen@student.unsw.edu.au", status: "voted" },
    { voter_id: "2", email: "raj.patel@student.unsw.edu.au", status: "invited" },
    { voter_id: "3", email: "sam.oconnor@student.unsw.edu.au", status: "pending" },
  ];
}

async function createVoters(
  campaignId: string,
  emails: string[],
): Promise<{ voter_id: string }[]> {
  await new Promise((r) => setTimeout(r, 300));
  console.log("createVoters", campaignId, emails);
  return emails.map(() => ({ voter_id: String(++mockVoterId) }));
}

async function deleteVoters(campaignId: string, voterIds: string[]) {
  await new Promise((r) => setTimeout(r, 200));
  console.log("deleteVoters", campaignId, voterIds);
}
// TODO

// TODO: uncomment following with query
/*
async function fetchVoters(campaignId: string): Promise<Voter[]> {
  const res = await fetch(`/campaigns/${campaignId}/voters`);
  if (!res.ok) throw new Error("Couldn't load voters.");
  return res.json();
}

async function createVoters(
  campaignId: string,
  emails: string[],
): Promise<{ voter_id: string }[]> {
  const res = await fetch(`/campaigns/${campaignId}/voters`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emails }),
  });
  if (res.status === 409) throw new Error("Some of those voters are already on the list.");
  if (!res.ok) throw new Error("Couldn't add those voters. Try again.");
  return res.json();
}

async function deleteVoters(campaignId: string, voterIds: string[]) {
  const res = await fetch(`/campaigns/${campaignId}/voters/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ voter_ids: voterIds }),
  });
  if (!res.ok) throw new Error("Couldn't remove those voters. Try again.");
}
*/

export const Route = createFileRoute("/_authed/elections/$electionId/invites")({
  component: RouteComponent,
});

function parseEmails(raw: string) {
  const parts = raw
    .split(/[\s,;]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const seen = new Set<string>();
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const part of parts) {
    if (seen.has(part)) continue;
    seen.add(part);

    if (EMAIL.test(part)) {
      valid.push(part);
    } else {
      invalid.push(part);
    }
  }
  return { valid, invalid };
}

function RouteComponent() {
  const { electionId } = Route.useParams();

  const [voters, setVoters] = useState<Voter[]>([]);
  const [raw, setRaw] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // TODO: delete between TODO lines since just for testing
  useEffect(() => {
    fetchVoters(electionId).then(setVoters);
  }, [electionId]);
  // TODO

  // TODO: uncomment following with query
  /*
  const { data: voters = [] } = useQuery({
    queryKey: ["voters", electionId],
    queryFn: () => fetchVoters(electionId),
  });
  */
  const { valid, invalid } = parseEmails(raw);
  const existing = new Set(voters.map((v) => v.email));
  const toAdd = valid.filter((e) => !existing.has(e));
  const duplicates = valid.length - toAdd.length;

  const add = async () => {
    if (toAdd.length === 0 || pending) return;
    setPending(true);
    setError(null);
    try {
      const created = await createVoters(electionId, toAdd);
      setVoters([
        ...voters,
        ...created.map((c, i) => ({
          voter_id: c.voter_id,
          email: toAdd[i],
          status: "pending" as const,
        })),
      ]);
      setRaw("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add those voters. Try again.");
    }
    setPending(false);
  };

  const remove = async (voterId: string) => {
    setVoters(voters.filter((v) => v.voter_id !== voterId));
    await deleteVoters(electionId, [voterId]);
  };

  return (
    <div className="w-full space-y-3">
      <Card className="p-4 space-y-2">
        <TextArea
          label="Add voters"
          placeholder="Paste emails from your spreadsheet, one per line"
          rows={4}
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
        />

        {raw.trim() && (
          <p className="text-xs text-muted/60">
            {toAdd.length} to add
            {duplicates > 0 && ` · ${duplicates} already on the list`}
            {invalid.length > 0 && ` · ${invalid.length} not valid emails`}
          </p>
        )}

        {invalid.length > 0 && (
          <p className="break-all text-xs text-red-600">
            Check these: {invalid.slice(0, 5).join(", ")}
            {invalid.length > 5 && ` and ${invalid.length - 5} more`}
          </p>
        )}

        {/* request failed, but not a field error */}
        {error && (
          <p role="alert" className="text-xs text-red-600">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={add}
          disabled={toAdd.length === 0 || pending}
          className="w-full rounded-lg bg-emphasis py-1.5 text-xs disabled:opacity-50"
        >
          {pending
            ? "Adding…"
            : `Add ${toAdd.length || ""} ${toAdd.length === 1 ? "voter" : "voters"}`}
        </button>
      </Card>

      <Card className="p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-xs text-muted/60">
            {voters.length} {voters.length === 1 ? "voter" : "voters"}
          </span>
          <span className="text-xs text-muted/60">
            {voters.filter((v) => v.status === "voted").length} voted
          </span>
        </div>

        {voters.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted/60">
            No voters yet. Paste some emails above to get started.
          </p>
        ) : (
          <ul className="divide-y divide-muted/20">
            {voters.map((voter) => (
              <li key={voter.voter_id} className="flex items-center gap-3 py-2">
                <span className="min-w-0 flex-1 truncate text-xs text-neutral-800">
                  {voter.email}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] ${STATUS_CLASS[voter.status]}`}>
                  {STATUS_LABEL[voter.status]}
                </span>
                <button
                  type="button"
                  disabled={voter.status === "voted"}
                  onClick={() => remove(voter.voter_id)}
                  title={voter.status === "voted" ? "Can't remove someone who has already voted" : undefined}
                  className="text-xs text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:text-muted/40! disabled:hover:text-red-600"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
