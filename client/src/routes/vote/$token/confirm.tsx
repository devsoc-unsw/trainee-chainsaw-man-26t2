import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/vote/$token/confirm")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/vote/$token/confirm"!</div>;
}
