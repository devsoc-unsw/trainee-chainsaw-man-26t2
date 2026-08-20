import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/count/$electionId")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/count/$electionId"!</div>;
}
