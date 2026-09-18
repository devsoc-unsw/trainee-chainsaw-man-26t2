import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/Card";
import { TextArea } from "@/components/Form";
import { DateTimeField } from "@/components/DateTimeField";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createVoters, deleteVoters, getCandidates, getRoles, getVoters, inviteVoters, updateCampaign } from "@/lib/api";
import type { Voter } from "@/lib/apiTypes";

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
  const queryClient = useQueryClient();
  const [raw, setRaw] = useState("");
  const [sendOpen, setSendOpen] = useState(false);

  const { data: voters = [] } = useQuery({
    queryKey: ["voters", electionId],
    queryFn: () => getVoters(electionId),
  });

  const uninvited = voters.filter((v) => v.status === "pending").length;
  
  const invalidate = () =>
  queryClient.invalidateQueries({ queryKey: ["voters", electionId] });

const addMutation = useMutation({
  mutationFn: (emails: Array<string>) => createVoters(electionId, emails),
  onSuccess: () => { invalidate(); setRaw(""); },
});

const removeMutation = useMutation({
  mutationFn: (voterId: string) => deleteVoters(electionId, [voterId]),
  onSuccess: invalidate,
});
  const { valid, invalid } = parseEmails(raw);
  const existing = new Set(voters.map((v) => v.email));
  const toAdd = valid.filter((e) => !existing.has(e));
  const duplicates = valid.length - toAdd.length;

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
        {addMutation.isError && (
  <p role="alert" className="text-xs text-red-600">
    Couldn't add those voters. Try again.
  </p>
)}

        <button
          type="button"
          onClick={() => { addMutation.mutate(toAdd); }}
          disabled={toAdd.length === 0 || addMutation.isPending}
          className="w-full rounded-lg bg-emphasis py-1.5 text-xs disabled:opacity-50"
        >
          {addMutation.isPending
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
                  onClick={() => { removeMutation.mutate(voter.voter_id); }}
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
        onSent={invalidate}
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

  const roles = useQuery({
    queryKey: ["roles", electionId],
    queryFn: () => getRoles(electionId),
    enabled: open,
  });
  const candidates = useQuery({
    queryKey: ["candidates", electionId],
    queryFn: () => getCandidates(electionId),
    enabled: open,
  });

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
      return;
    }
  }, [open, electionId]);

  // TODO: every check below is frontend-only, needs to be enforced by backend
  const now = Date.now();
  const blockers: string[] = [];
  if (roles.data?.length === 0) blockers.push("Add at least one role");
  if (candidates.data?.length === 0) blockers.push("Add at least one candidate");
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

  const ready = !roles.isPending && !candidates.isPending && blockers.length === 0;

  const sendMutation = useMutation({
    mutationFn: async ({ opening, closing }: { opening: Date; closing: Date }) => {
      await updateCampaign(electionId, {
        opening_date_time: opening.toISOString(),
        closing_date_time: closing.toISOString(),
      });
      await inviteVoters(electionId);
    },
    onSuccess: () => { onSent(); onClose(); },
  });

  const send = async () => {
    if (!ready || sendMutation.isPending) return;
  sendMutation.mutate({
    opening: startNow ? new Date(Date.now() + 60_000) : opening!,
    closing: closing!,
  });
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

          {sendMutation.isError && (
            <p role="alert" className="text-xs text-red-600">
              Couldn't send the invitations. Try again.
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
              disabled={!ready || sendMutation.isPending}
              className="rounded-full bg-emphasis px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {sendMutation.isPending ? "Sending…" : startNow ? "Send now" : "Schedule"}
            </button>
          </div>
        </div>
      </Card>
    </dialog>
  );
}
