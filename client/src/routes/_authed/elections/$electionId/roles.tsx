import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Field, TextArea } from "@/components/Form";
import { Card } from "@/components/Card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createRole, deleteRole, getRoles, updateRole } from "@/lib/api";
import type { Role, UpdateRoleRequest } from "@/lib/apiTypes";

export const Route = createFileRoute("/_authed/elections/$electionId/roles")({
  component: RouteComponent,
});

function RouteComponent() {
  const { electionId } = Route.useParams();

  const { data, isPending, error } = useQuery({
    queryKey: ["roles", electionId],
    queryFn: () => getRoles(electionId),
  });

  if (isPending) return <p className="p-4 text-xs">Loading…</p>;
  if (error) return <p className="p-4 text-xs">Couldn't load roles.</p>;

  return <RolesEditor electionId={electionId} roles={data} />;
}

function RolesEditor({
  electionId,
  roles: serverRoles,
}: {
  electionId: string;
  roles: Array<Role>;
}) {
  const queryClient = useQueryClient();
  const [roles, setRoles] = useState(serverRoles);

  useEffect(() => {
    setRoles(serverRoles);
  }, [serverRoles]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["roles", electionId] });

  const createMutation = useMutation({
    mutationFn: () =>
      createRole(electionId, {
        title: "",
        description: "",
        no_of_positions: 1,
        enable_abstention: true,
      }),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      roleId,
      changes,
    }: {
      roleId: string;
      changes: UpdateRoleRequest;
    }) => updateRole(electionId, roleId, changes),
  });

  const deleteMutation = useMutation({
    mutationFn: (roleId: string) => deleteRole(electionId, roleId),
    onSuccess: invalidate,
  });

  const update = (
    id: string,
    key: keyof Role,
    value: string | number | boolean,
  ) => {
    setRoles((prev) =>
      prev.map((r) => (r.role_id === id ? { ...r, [key]: value } : r)),
    );
  };

  const save = (role: Role, key: keyof UpdateRoleRequest) => {
    const original = serverRoles.find((r) => r.role_id === role.role_id);
    if (original && original[key] === role[key]) return;
    updateMutation.mutate({
      roleId: role.role_id,
      changes: { [key]: role[key] },
    });
  };

  return (
    <div className="w-full space-y-3">
      {roles.map((role, i) => (
        <Card key={role.role_id} className="p-4 space-y-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted/60">Role #{i + 1}</span>
            <button
              onClick={() => {
                deleteMutation.mutate(role.role_id);
              }}
              className="text-xs text-neutral-500 hover:text-neutral-900"
            >
              Remove
            </button>
          </div>

          <Field
            label="Title"
            placeholder="Input field"
            value={role.title}
            onChange={(e) => {
              update(role.role_id, "title", e.target.value);
            }}
            onBlur={() => {
              save(role, "title");
            }}
          />

          <TextArea
            label="Description"
            placeholder="Input field"
            rows={3}
            maxLength={200}
            hint={`${role.description.length}/200`}
            value={role.description}
            onChange={(e) => {
              update(role.role_id, "description", e.target.value);
            }}
            onBlur={() => {
              save(role, "description");
            }}
          />

          <Field
            label="Number of winners"
            placeholder="Input field"
            type="number"
            min={1}
            value={role.no_of_positions}
            error={
              !Number.isInteger(role.no_of_positions) ||
              role.no_of_positions < 1
                ? "Must be an integer greater or equal to 1"
                : undefined
            }
            onChange={(e) => {
              update(role.role_id, "no_of_positions", Number(e.target.value));
            }}
            onBlur={() => {
              save(role, "no_of_positions");
            }}
          />

          <label className="flex items-center gap-2 pt-3 text-xs text-neutral-800">
            <input
              type="checkbox"
              checked={role.enable_abstention}
              onChange={(e) => {
                update(role.role_id, "enable_abstention", e.target.checked);
                updateMutation.mutate({
                  roleId: role.role_id,
                  changes: { enable_abstention: e.target.checked },
                });
              }}
              className="h-4 w-4 rounded border border-muted/40 bg-input accent-blue"
            />
            Enable abstain
          </label>
        </Card>
      ))}

      <Card className="p-3">
        <button
          onClick={() => {
            createMutation.mutate();
          }}
          className="w-full rounded-lg bg-emphasis py-1.5 text-xs"
        >
          Click to add +
        </button>
      </Card>
    </div>
  );
}
