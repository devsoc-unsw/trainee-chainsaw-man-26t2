import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Field, TextArea } from "@/components/Form";
import { Card } from "@/components/Card";

interface Role {
  role_id: string;
  title: string;
  description: string;
  no_of_positions: number;
  enable_abstention: boolean;
}

// TODO: delete between todo since it's just for testing
const STUB_ROLES: Role[] = [
  {
    role_id: "1",
    title: "President",
    description: "Chairs meetings and represents the society",
    no_of_positions: 1,
    enable_abstention: true,
  },
  {
    role_id: "2",
    title: "Treasurer",
    description: "Manages the budget",
    no_of_positions: 2,
    enable_abstention: false,
  },
];
// TODO

export const Route = createFileRoute("/_authed/elections/$electionId/roles")({
  component: RouteComponent,
});

function RouteComponent() {
  // delete const line since it's just for testing
  const [roles, setRoles] = useState<Role[]>(STUB_ROLES);

  const update = (id: string, key: keyof Role, value: string | number | boolean) =>
    setRoles(roles.map((r) => (r.role_id === id ? { ...r, [key]: value } : r)));

  // TODO: delete between TODO lines, just for testing + uncomment block after
  const nextId = () => String(Date.now());
  const addRole = () =>
    setRoles([
      ...roles,
      {
        role_id: nextId(),
        title: "",
        description: "",
        no_of_positions: 1,
        enable_abstention: true,
      }
    ]);
  // TODO

  /*
  // new array that contains everything already in roles, plus a blank at end
  const addRole = async () => {
    const { role_id } = await createRole(electionId, {
      title: "",
      description: "",
      no_of_positions: 1,
      enable_abstention: true,
    });

    setRoles([
      ...roles,
      {
        role_id,
        title: "",
        description: "",
        no_of_positions: 1,
        enable_abstention: true,
      }
    ]);
  };
  */

  const removeRole = (id: string) =>
    setRoles(roles.filter((r) => r.role_id !== id));

  return (
    <div className="w-full space-y-3">
      {roles.map((role, i) => (
        <Card key={role.role_id} className="p-4 space-y-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted/60">
              Role #{i + 1}
            </span>
            <button
              onClick={() => removeRole(role.role_id)}
              className="text-xs text-neutral-500 hover:text-neutral-900"
            >
              Remove
            </button>
          </div>

          <Field
            label="Title"
            placeholder="Input field"
            value={role.title}
            onChange={(e) => update(role.role_id, "title", e.target.value)}
          />

          <TextArea
            label="Description"
            placeholder="Input field"
            rows={3}
            maxLength={200}
            hint={`${role.description.length}/200`}
            value={role.description}
            onChange={(e) => update(role.role_id, "description", e.target.value)}
          />

          <Field
            label="Number of winners"
            placeholder="Input field"
            type="number"
            min={1}
            value={role.no_of_positions}
            error={!Number.isInteger(role.no_of_positions) || role.no_of_positions < 1
              ? "Must be an integer greater or equal to 1"
              : undefined
            }
            onChange={(e) => update(role.role_id, "no_of_positions", Number(e.target.value))}
          />

          <label className="flex items-center gap-2 pt-3 text-xs text-neutral-800">
            <input
              type="checkbox"
              checked={role.enable_abstention}
              onChange={(e) => update(role.role_id, "enable_abstention", e.target.checked)}
              className="h-4 w-4 rounded border border-muted/40 bg-input accent-blue"
            />
            Enable abstain
          </label>
        </Card>
      ))}

      <Card className="p-3">
        <button
        onClick={addRole}
        className="w-full rounded-lg bg-emphasis py-1.5 text-xs"
        >
          Click to add +
        </button>
      </Card>
    </div>
  );
}
