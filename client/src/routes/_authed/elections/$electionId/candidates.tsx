import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Field, TextArea, labelClass } from "@/components/Form";
import { Card } from "@/components/Card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createCandidate, deleteCandidate, getCandidates, getRoles, updateCandidate } from "@/lib/api";
import type { Candidate, Role, UpdateCandidateRequest } from "@/lib/apiTypes";

const MAX_MANIFESTO = 1000;
// concentric ring palette cycled by role order for role selection
const CHIP_COLOURS = [
  "bg-ring-1 text-on-dark",
  "bg-ring-2 text-on-dark",
  "bg-ring-3 text-on-dark",
  "bg-ring-4 text-muted",
  "bg-ring-5 text-muted",
];

// checks for exactly one @, no whitespace and dot in the domain
const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const Route = createFileRoute(
  "/_authed/elections/$electionId/candidates",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { electionId } = Route.useParams();
  const roles = useQuery({ queryKey:  ["roles", electionId], queryFn: () => getRoles(electionId) });
  const candidates = useQuery({ queryKey: ["candidates", electionId], queryFn: () => getCandidates(electionId) });
  if (roles.isPending || candidates.isPending) return <p className="p-4 text-xs">Loading…</p>;
  if (roles.error || candidates.error) return <p className="p-4 text-xs">Couldn't load candidates.</p>;
  if (roles.data.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-center text-xs">Add at least one role before adding candidate(s).</p>
      </Card>
    );
  }

  return <CandidatesEditor electionId={electionId} roles={roles.data} candidates={candidates.data} />;
}

function CandidatesEditor({
  electionId,
  roles,
  candidates: serverCandidates,
}: {
  electionId: string;
  roles: Array<Role>;
  candidates: Array<Candidate>;
}) {
  const queryClient = useQueryClient();
  const [candidates, setCandidates] = useState(serverCandidates);

  useEffect(() => { setCandidates(serverCandidates); }, [serverCandidates]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["candidates", electionId] });

const createMutation = useMutation({
  mutationFn: () =>
    createCandidate(electionId, {
      first_name: "",
      last_name: "",
      email: "",
      role_ids: [roles[0].role_id],
    }),
  onSuccess: invalidate,
});

const updateMutation = useMutation({
  mutationFn: ({ candidateId, changes }: { candidateId: string; changes: UpdateCandidateRequest }) =>
    updateCandidate(electionId, candidateId, changes),
  onSettled: invalidate,
});

const deleteMutation = useMutation({
  mutationFn: (candidateId: string) => deleteCandidate(electionId, candidateId),
  onSuccess: invalidate,
});

const update = <K extends keyof Candidate>(id: string, key: K, value: Candidate[K]) => {
  setCandidates((prev) =>
    prev.map((c) => (c.candidate_id === id ? { ...c, [key]: value } : c)),
  );
};

const save = (candidate: Candidate, key: keyof UpdateCandidateRequest) => {
  const original = serverCandidates.find((c) => c.candidate_id === candidate.candidate_id);
  if (!original || original[key] === candidate[key]) return;
  if (key === "email" && !isValidEmail(candidate.email)) return;
  updateMutation.mutate({
    candidateId: candidate.candidate_id,
    changes: { [key]: candidate[key] } as UpdateCandidateRequest,
  });
};

  return (
    <div className="w-full space-y-3">
      {candidates.map((candidate, i) => (
        <Card key={candidate.candidate_id} className="space-y-2 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted/60">Candidate #{i + 1}</span>
            <button
              onClick={() => {
                deleteMutation.mutate(candidate.candidate_id);
              }}
              className="text-xs text-neutral-500 hover:text-neutral-900"
            >
              Remove
            </button>
          </div>

          <Field
            label="First Name"
            placeholder="Input Field"
            value={candidate.first_name}
            onChange={(e) => {
              update(candidate.candidate_id, "first_name", e.target.value);
            }}
            onBlur={() => {
              save(candidate, "first_name");
            }}
          />
          <Field
            label="Last Name"
            placeholder="Input Field"
            value={candidate.last_name}
            onChange={(e) => {
              update(candidate.candidate_id, "last_name", e.target.value);
            }}
            onBlur={() => {
              save(candidate, "last_name");
            }}
          />
          <Field
            label="Email"
            type="email"
            placeholder="Input Field"
            value={candidate.email}
            error={
              candidate.email !== "" && !isValidEmail(candidate.email)
                ? "Must be a valid email"
                : undefined
            }
            onChange={(e) => {
              update(candidate.candidate_id, "email", e.target.value);
            }}
            onBlur={() => {
              save(candidate, "email");
            }}
          />
          <TextArea
            label="Manifesto"
            placeholder="Input Field"
            value={candidate.manifesto ?? ""}
            maxLength={MAX_MANIFESTO}
            hint={`${(candidate.manifesto ?? "").length}/${MAX_MANIFESTO}`}
            onChange={(e) => {
              update(candidate.candidate_id, "manifesto", e.target.value);
            }}
            onBlur={() => {
              save(candidate, "manifesto");
            }}
          />
          <RoleSelect
            roles={roles}
            selected={candidate.role_ids}
            onChange={(next) => {
              update(candidate.candidate_id, "role_ids", next);
              if (next.length > 0) updateMutation.mutate({ candidateId: candidate.candidate_id, changes: { role_ids: next } });
            }}
          />
        </Card>
      ))}

      <Card className="p-3">
        <button
          onClick={ () => { createMutation.mutate() }}
          className="w-full rounded-lg bg-emphasis py-2 text-xs"
        >
          Click to add +
        </button>
      </Card>
    </div>
  );
}

function RoleSelect({
  roles,
  selected,
  onChange,
}: {
  roles: Role[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const unselected = roles.filter((r) => !selected.includes(r.role_id));

  return (
    <div>
      <label className={labelClass}>Select role(s) applied</label>
      <div className="flex flex-wrap items-center gap-1 rounded-full border border-muted/40 bg-input px-3 py-2">
        {selected.map((id) => {
          const role = roles.find((r) => r.role_id === id);
          const index = Math.max(
            0,
            roles.findIndex((r) => r.role_id === id),
          );
          return (
            <span
              key={id}
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${CHIP_COLOURS[index % CHIP_COLOURS.length]}`}
            >
              {role?.title ?? id}
              <button
                onClick={() => {
                  onChange(selected.filter((x) => x !== id));
                }}
                aria-label={`Remove ${role?.title ?? id}`}
                className="text-sm leading-none opacity-50 transition-opacity hover:opacity-100"
              >
                &times;
              </button>
            </span>
          );
        })}

        {unselected.length > 0 && (
          <select
            className="cursor-pointer appearance-none bg-transparent px-1 text-xs outline-none"
            value=""
            onChange={(e) => {
              onChange([...selected, e.target.value]);
            }}
          >
            <option value="" disabled>
              +
            </option>
            {unselected.map((r) => (
              <option key={r.role_id} value={r.role_id}>
                {r.title}
              </option>
            ))}
          </select>
        )}
      </div>
      {selected.length === 0 && (
        <p className="mt-1 text-xs text-red-600">Select at least one role</p>
      )}
    </div>
  );
}
