import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

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

  return (
    <div>{roles.length} roles
    </div>
  );
}
