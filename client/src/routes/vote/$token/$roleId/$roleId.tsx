import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/vote/$token/$roleId/$roleId")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/vote/$token/$roleId/$roleId"!</div>;
}
