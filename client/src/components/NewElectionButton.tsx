import { Link } from "@tanstack/react-router";

export function NewElectionButton() {
  return (
    <Link
      to="/elections/$electionId"
      params={{ electionId: "draft-1" }}
      className="rounded-full bg-emphasis px-4 py-2 text-sm font-medium text-muted"
    >
      New Election
    </Link>
  );
}
