import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { PullCord } from "@/components/PullCord";

export const Route = createFileRoute("/_authed/elections/$electionId")({
  component: RouteComponent,
});

const TABS = [
  { to: "/elections/$electionId", label: "Overview", exact: true },
  { to: "/elections/$electionId/roles", label: "Roles", exact: false },
  { to: "/elections/$electionId/candidates", label: "Candidates", exact: false },
  { to: "/elections/$electionId/invites", label: "Invites", exact: false },
  { to: "/elections/$electionId/settings", label: "Settings", exact: false },
  { to: "/elections/$electionId/results", label: "Results", exact: false },
] as const;

const ROW = 40;
const NAV_HEIGHT = TABS.length * ROW;

function RouteComponent() {
  const { electionId } = Route.useParams();
  // nav bar open by default
  const [open, setOpen] = useState(true);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const toggle = useCallback(() => setOpen((o) => !o), []);

  return (
    <div className="mx-auto flex w-full max-w-5xl gap-10 px-6 py-8">
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>

      {/* navigation bar */}
      <div
        className="w-36 shrink-0"
        onPointerMove={(e) => setPointer({ x: e.clientX, y: e.clientY })}
        onPointerLeave={() => setPointer(null)}
      >
        {/* Pills slide down out from behind the header when pulled open */}
        <div
          className="overflow-hidden transition-[height] duration-500 ease-out"
          style={{ height: open ? NAV_HEIGHT : 0 }}
        >
          <nav aria-hidden={!open} className="flex flex-col gap-2">
            {TABS.map((tab) => (
              <Link
                key={tab.label}
                to={tab.to}
                params={{ electionId }}
                activeOptions={{ exact: tab.exact }}
                tabIndex={open ? undefined : -1}
                className="rounded-full border border-on-dark/40 px-4 py-1.5 text-center text-xs"
                activeProps={{
                  className: "bg-card text-xs border-transparent",
                }}
                inactiveProps={{ className: "text-on-dark" }}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>

        <PullCord open={open} onToggle={toggle} length={open ? 200 : 420} pointer={pointer}/>
      </div>
    </div>
  );
}
