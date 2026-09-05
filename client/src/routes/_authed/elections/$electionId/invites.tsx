import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/Card";
import { TextArea } from "@/components/Form";
import { DateTimeField } from "@/components/DateTimeField";

interface Voter {
  voter_id: string;
  email: string;
  status: "pending" | "invited" | "voted";
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// TODO: change tolerance from 10 mins to what is appropriate given backend (note 1 hour is a preset not a limit)
const MIN_OPENING_LEAD_MS = 10 * 60_000;

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
    {
      voter_id: "1",
      email: "amelia.chen@student.unsw.edu.au",
      status: "voted",
    },
    {
      voter_id: "2",
      email: "raj.patel@student.unsw.edu.au",
      status: "invited",
    },
    {
      voter_id: "3",
      email: "sam.oconnor@student.unsw.edu.au",
      status: "pending",
    },
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

async function fetchReadiness(campaignId: string) {
  await new Promise((r) => setTimeout(r, 200));
  console.log("fetchReadiness", campaignId);
  return { roles: 2, candidates: 4 };
}

async function scheduleAndInvite(
  campaignId: string,
  opening: Date,
  closing: Date,
) {
  await new Promise((r) => setTimeout(r, 400));
  console.log("scheduleAndInvite", campaignId, opening, closing);
}

async function startNowAndInvite(campaignId: string, closing: Date) {
  await new Promise((r) => setTimeout(r, 400));
  console.log("startNowAndInvite", campaignId, closing);
}
// TODO

// TODO: uncomment following with query, for add voters
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

// TODO: uncomment following with query, for schedule send button
/*
async function fetchReadiness(campaignId: string) {
  const [rolesRes, candidatesRes] = await Promise.all([
    fetch(`/campaigns/${campaignId}/roles`),
    fetch(`/campaigns/${campaignId}/candidates`),
  ]);
  if (!rolesRes.ok || !candidatesRes.ok) throw new Error("Couldn't check this election.");
  const roles = await rolesRes.json();
  const candidates = await candidatesRes.json();
  return { roles: roles.length, candidates: candidates.length };
}

async function scheduleAndInvite(
  campaignId: string,
  opening: Date,
  closing: Date,
) {
  const patch = await fetch(`/campaigns/${campaignId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      opening_date_time: opening.toISOString(),
      closing_date_time: closing.toISOString(),
    }),
  });
  if (!patch.ok) throw new Error("Couldn't save the schedule. Try again.");

  const invite = await fetch(`/campaigns/${campaignId}/voters/invite`, {
    method: "POST",
  });
  if (!invite.ok) throw new Error("Couldn't send the invitations. Try again.");
}

// TODO: the start_now flag is a placeholder. We can't send a client-stamped "now" here.
// Rewrite given:
//
//   a) inviting opens the campaign  -> drop start_now, PATCH only closing_date_time
//   b) separate start endpoint      -> drop start_now, POST /campaigns/:id/start after
//                                      the PATCH, and give the PATCH-succeeded-but-start-
//                                      failed case its own message so nobody resubmits
//   c) opening_date_time stays required and must be future
//                                   -> "Now" can't exist; delete the mode toggle in
//                                      SendDialog and always take the scheduled path
async function startNowAndInvite(campaignId: string, closing: Date) {
  const patch = await fetch(`/campaigns/${campaignId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      start_now: true,
      closing_date_time: closing.toISOString(),
    }),
  });
  if (!patch.ok) throw new Error("Couldn't start the election. Try again.");

  const invite = await fetch(`/campaigns/${campaignId}/voters/invite`, {
    method: "POST",
  });
  if (!invite.ok) throw new Error("Couldn't send the invitations. Try again.");
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

  // for Schedule Send
  const [sendOpen, setSendOpen] = useState(false);
  const uninvited = voters.filter((v) => v.status === "pending").length;

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
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't add those voters. Try again.",
      );
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
          placeholder="Paste a column from your spreadsheet, or type emails separated by commas"
          rows={4}
          value={raw}
          onChange={(e) => {
            setRaw(e.target.value);
          }}
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
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] ${STATUS_CLASS[voter.status]}`}
                >
                  {STATUS_LABEL[voter.status]}
                </span>
                <button
                  type="button"
                  disabled={voter.status === "voted"}
                  onClick={() => remove(voter.voter_id)}
                  title={
                    voter.status === "voted"
                      ? "Can't remove someone who has already voted"
                      : undefined
                  }
                  className="text-xs text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:text-muted/40! disabled:hover:text-red-600"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-3">
        <button
          type="button"
          onClick={() => {
            setSendOpen(true);
          }}
          disabled={uninvited === 0}
          className="w-full rounded-lg bg-emphasis py-1.5 text-xs disabled:opacity-50"
        >
          {uninvited === 0
            ? "Everyone has been invited"
            : `Send ${uninvited} ${uninvited === 1 ? "invitation" : "invitations"}`}
        </button>
      </Card>

      <SendDialog
        open={sendOpen}
        onClose={() => {
          setSendOpen(false);
        }}
        electionId={electionId}
        uninvited={uninvited}
        onSent={() => {
          setVoters(
            voters.map((v) =>
              v.status === "pending" ? { ...v, status: "invited" } : v,
            ),
          );
        }}
      />
    </div>
  );
}

function SendDialog({
  open,
  onClose,
  electionId,
  uninvited,
  onSent,
}: {
  open: boolean;
  onClose: () => void;
  electionId: string;
  uninvited: number;
  onSent: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [startNow, setStartNow] = useState(true);
  const [opening, setOpening] = useState<Date | undefined>();
  const [closing, setClosing] = useState<Date | undefined>();
  const [readiness, setReadiness] = useState<{
    roles: number;
    candidates: number;
  } | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) {
      setStartNow(true);
      setOpening(undefined);
      setClosing(undefined);
      setPending(false);
      setError(null);
      return;
    }
    fetchReadiness(electionId)
      .then(setReadiness)
      .catch(() => {
        setReadiness(null);
      });
  }, [open, electionId]);

  // TODO: every check below is frontend-only, needs to be enforced by backend
  const now = Date.now();
  const blockers: string[] = [];
  if (readiness) {
    if (readiness.roles === 0) blockers.push("Add at least one role");
    if (readiness.candidates === 0) blockers.push("Add at least one candidate");
  }
  if (uninvited === 0) blockers.push("No one left to invite");
  if (!startNow && !opening) blockers.push("Choose when voting opens");
  if (!closing) blockers.push("Choose when voting closes");
  if (!startNow && opening && opening.getTime() < now + MIN_OPENING_LEAD_MS) {
    blockers.push("Voting must open at least 10 minutes from now");
  }
  if (closing && closing.getTime() <= now) {
    blockers.push("Voting must close in the future");
  }
  if (!startNow && opening && closing && closing <= opening) {
    blockers.push("Voting must close after it opens");
  }

  const ready = readiness !== null && blockers.length === 0;

  const send = async () => {
    if (!ready || pending) return;
    setPending(true);
    setError(null);
    try {
      if (startNow) {
        await startNowAndInvite(electionId, closing!);
      } else {
        await scheduleAndInvite(electionId, opening!, closing!);
      }
      onSent();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't send the invitations. Try again.",
      );
      setPending(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="send-invites-heading"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      className="m-auto w-fit min-w-[20rem] max-w-[calc(100vw-2rem)] bg-transparent p-0 backdrop:bg-black/50"
    >
      <Card className="max-h-[85vh] overflow-y-auto p-6">
        <div className="flex flex-col gap-4">
          <h2 id="send-invites-heading" className="text-sm font-medium">
            Send invitations
          </h2>

          <div className="flex flex-col gap-2">
            <span className="text-xs text-neutral-800">Voting opens</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setStartNow(true);
                }}
                className={`rounded-full px-3 py-1 text-xs ${
                  startNow
                    ? "bg-emphasis text-neutral-900"
                    : "border border-muted/40"
                }`}
              >
                Now
              </button>
              <button
                type="button"
                onClick={() => {
                  setStartNow(false);
                }}
                className={`rounded-full px-3 py-1 text-xs ${
                  startNow
                    ? "border border-muted/40"
                    : "bg-emphasis text-neutral-900"
                }`}
              >
                Schedule
              </button>
            </div>

            {startNow && (
              <p className="text-xs text-muted/60">
                Voting starts as soon as you send the invitations.
              </p>
            )}
          </div>

          <div className={startNow ? undefined : "grid gap-4 sm:grid-cols-2"}>
            {!startNow && (
              <DateTimeField
                id="opening"
                label="Opens"
                value={opening}
                onChange={setOpening}
                minDate={new Date()}
                presets={[
                  {
                    label: "In an hour",
                    getDate: () => {
                      const d = new Date(Date.now() + 60 * 60_000);
                      d.setMinutes(0, 0, 0);
                      return d;
                    },
                  },
                  {
                    label: "Tomorrow 9am",
                    getDate: () => {
                      const d = new Date();
                      d.setDate(d.getDate() + 1);
                      d.setHours(9, 0, 0, 0);
                      return d;
                    },
                  },
                ]}
              />
            )}

            <DateTimeField
              id="closing"
              label="Closes"
              value={closing}
              onChange={setClosing}
              minDate={startNow ? new Date() : opening}
              defaultTime="17:00"
              presets={[
                {
                  label: "In 3 days",
                  getDate: () => {
                    const d = new Date();
                    d.setDate(d.getDate() + 3);
                    d.setHours(17, 0, 0, 0);
                    return d;
                  },
                },
                {
                  label: "In a week",
                  getDate: () => {
                    const d = new Date();
                    d.setDate(d.getDate() + 7);
                    d.setHours(17, 0, 0, 0);
                    return d;
                  },
                },
              ]}
            />
          </div>

          <p className="text-xs text-muted/60">
            {uninvited} {uninvited === 1 ? "person" : "people"} will be emailed
            a voting link.
          </p>

          {blockers.length > 0 && (
            <ul className="space-y-0.5">
              {blockers.map((b) => (
                <li key={b} className="text-xs text-red-600">
                  {b}
                </li>
              ))}
            </ul>
          )}

          {error && (
            <p role="alert" className="text-xs text-red-600">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={send}
              disabled={!ready || pending}
              className="rounded-full bg-emphasis px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {pending ? "Sending…" : startNow ? "Send now" : "Schedule"}
            </button>
          </div>
        </div>
      </Card>
    </dialog>
  );
}
