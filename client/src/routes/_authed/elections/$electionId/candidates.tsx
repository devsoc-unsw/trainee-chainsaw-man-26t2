import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Field, TextArea, labelClass } from "@/components/Form";
import { Card } from "@/components/Card";

const MAX_MANIFESTO = 1000;
// concentric ring palette cycled by role order for role selection
const CHIP_COLOURS = [
  "bg-ring-1 text-on-dark",
  "bg-ring-2 text-on-dark",
  "bg-ring-3 text-on-dark",
  "bg-ring-4 text-muted",
  "bg-ring-5 text-muted",
]

// checks for exactly one @, no whitespace and dot in the domain
const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

// fetch data on roles to unlock candidates, and used in multi-select
interface Role {
  role_id: string;
  title: string;
  description: string;
  no_of_positions: number;
  enable_abstention: boolean;
}

interface Candidate {
  candidate_id: string;
  first_name: string;
  last_name: string;
  email: string;
  manifesto: string;
  role_ids: string[];
}

// TODO: delete between TODO since it's just for testing
const STUB_ROLES: Role[] = [
  { role_id: "1", title: "President", description: "Chairs meetings", no_of_positions: 1, enable_abstention: true },
  { role_id: "2", title: "Treasurer", description: "Manages the budget", no_of_positions: 2, enable_abstention: false },
  { role_id: "3", title: "Secretary", description: "Takes minutes", no_of_positions: 1, enable_abstention: true },
];

const HAS_ROLES = true;

const fetchRoles = async (_electionID: string): Promise<Role[]> => {
  await new Promise((r) => setTimeout(r, 300));
  return HAS_ROLES ? STUB_ROLES : [];
}
// TODO

// TODO: uncomment out following given query
/*
const fetchRoles = async (electionId: string): Promise<Role[]> => {
  const res = await fetch(`/api/elections/${electionId}/roles`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
};
*/

export const Route = createFileRoute(
  "/_authed/elections/$electionId/candidates",
)({
  loader: ({ params }) => fetchRoles(params.electionId),
  component: RouteComponent,
});

function RouteComponent() {
  const roles = Route.useLoaderData();
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  const update = <K extends keyof Candidate>(
    id: string,
    key: K,
    value: Candidate[K],
  ) =>
    setCandidates((prev) =>
      prev.map((c) => (c.candidate_id === id ? { ...c, [key]: value } : c)),
    );

  // TODO: delete between TODO lines since it's just for testing
  const nextId = () => String(Date.now());
  const addCandidate = () =>
    setCandidates([
      ...candidates,
      {
        candidate_id: nextId(),
        first_name: "",
        last_name: "",
        email: "",
        manifesto: "",
        role_ids: [],
      },
    ])

  // TODO

  // TODO: uncomment out below with query
  /*
  const addCandidate = async () => {
    const { candidate_id } = await createCandidate(electionId, {
      first_name: "",
      last_name: "",
      email: "",
      manifesto: "",
      role_ids: [],
    });

    setCandidates([
      ...candidates,
      {
        candidate_id,
        first_name: "",
        last_name: "",
        email: "",
        manifesto: "",
        role_ids: [],
      },
    ]);
  };
  */

  const removeCandidate = (id: string) =>
    setCandidates(candidates.filter((c) => c.candidate_id !== id));

  if (roles.length === 0) {
    return (
      <div className="w-full space-y-3">
        <Card className="p-4">
          <p className="text-center text-xs">
            Add at least one role before adding candidate(s).
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      {candidates.map((candidate, i) => (
        <Card key={candidate.candidate_id} className="space-y-2 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted/60">
              Candidate #{i + 1}
            </span>
            <button
              onClick={() => removeCandidate(candidate.candidate_id)}
              className="text-xs text-neutral-500 hover:text-neutral-900"
            >
              Remove
            </button>
          </div>

          <Field
            label="First Name"
            placeholder="Input Field"
            value={candidate.first_name}
            onChange={(e) => update(candidate.candidate_id, "first_name", e.target.value)}
          />
          <Field
            label="Last Name"
            placeholder="Input Field"
            value={candidate.last_name}
            onChange={(e) => update(candidate.candidate_id, "last_name", e.target.value)}
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
            onChange={(e) => update(candidate.candidate_id, "email", e.target.value)}
          />
          <TextArea
            label="Manifesto"
            placeholder="Input Field"
            value={candidate.manifesto}
            maxLength={MAX_MANIFESTO}
            hint={`${candidate.manifesto.length}/${MAX_MANIFESTO}`}
            onChange={(e) => update(candidate.candidate_id, "manifesto", e.target.value)}
          />
          <RoleSelect
            roles={roles}
            selected={candidate.role_ids}
            onChange={(next) => update(candidate.candidate_id, "role_ids", next)}
          />
        </Card>
      ))}

      <Card className="p-3">
        <button
          onClick={addCandidate}
          className="w-full rounded-full bg-emphasis py-2 text-xs"
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
          const index = Math.max(0, roles.findIndex((r) => r.role_id === id));
          return (
            <span key={id} className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${CHIP_COLOURS[index % CHIP_COLOURS.length]}`}>
              {role?.title ?? id}
              <button onClick={() => onChange(selected.filter((x) => x !== id))}
                aria-label={`Remove ${role?.title ?? id}`}
                className="text-sm leading-none opacity-50 transition-opacity hover:opacity-100"
              >
                &times;
              </button>
            </span>
          );
        })}

        {unselected.length > 0 && (
          <select className="cursor-pointer appearance-none bg-transparent px-1 text-xs outline-none" value="" onChange={(e) => onChange([...selected, e.target.value])}>
            <option value="" disabled>+</option>
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