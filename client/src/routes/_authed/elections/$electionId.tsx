import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/elections/$electionId")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex justify-center gap-16 p-8">
      <div className="min-w-0 flex-1 max-w-4xl">
        <Outlet />
      </div>
      {/* navigation bar */}
    </div>
  );
}
