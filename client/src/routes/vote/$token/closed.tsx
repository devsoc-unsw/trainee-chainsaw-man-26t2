import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/vote/$token/closed")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/vote/$token/closed"!</div>;
}
