import { createFileRoute } from "@tanstack/react-router";
// import { useQuery } from "@tanstack/react-query"
import { Section } from "@/components/Section";
import { LiveCard } from "@/components/LiveCard";

export const Route = createFileRoute("/_authed/dashboard")({
  component: RouteComponent,
});

export interface Campaign {
  campaign_id: string;
  title: string;
  description: string;
  opening_date_time: string;
  closing_date_time: string;
  allowed_role_overlaps: boolean;
  voter_count?: number;
  voted_count?: number;
}

function RouteComponent() {
  // idk abt this part + no query yet
  // const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
  //   queryKey: ["campaigns"],
  //   queryFn: () => fetch("/api/campaigns").then((r) => r.json()),
  // });

  // TODO: delete between TODO lines when query on
  const campaigns: Campaign[] = [
    {
      campaign_id: "1",
      title: "2026 Executive EGM",
      description: "",
      opening_date_time: "2026-08-25T09:00:00Z",
      closing_date_time: "2026-09-15T17:00:00Z",
      allowed_role_overlaps: false,
      voter_count: 90,
      voted_count: 30,
    },
    {
      campaign_id: "2",
      title: "Constitutional Amendment Vote",
      description: "",
      opening_date_time: "2026-08-28T09:00:00Z",
      closing_date_time: "2026-09-05T17:00:00Z",
      allowed_role_overlaps: false,
    },
    {
      campaign_id: "3",
      title: "True or True",
      description: "",
      opening_date_time: "2026-10-05T09:00:00Z",
      closing_date_time: "2026-10-06T17:00:00Z",
      allowed_role_overlaps: false,
    },
    {
      campaign_id: "4",
      title: "In-Person or Online Meeting",
      description: "",
      opening_date_time: "2026-10-12T09:00:00Z",
      closing_date_time: "2026-10-13T17:00:00Z",
      allowed_role_overlaps: false,
    },
    {
      campaign_id: "5",
      title: "2025 Executive EGM",
      description: "",
      opening_date_time: "2025-03-01T09:00:00Z",
      closing_date_time: "2025-03-02T17:00:00Z",
      allowed_role_overlaps: false,
    },
    {
      campaign_id: "6",
      title: "Grouping or Attribute",
      description: "",
      opening_date_time: "2025-04-01T09:00:00Z",
      closing_date_time: "2025-04-02T17:00:00Z",
      allowed_role_overlaps: false,
    },
  ];
  const isLoading = false;
  // TODO

  // filter campign into either live, upcoming or closed
  const now = new Date();

  const live = campaigns.filter(
    (c) =>
      new Date(c.opening_date_time) <= now &&
      new Date(c.closing_date_time) > now,
  );
  const upcoming = campaigns.filter((c) => new Date(c.opening_date_time) > now);
  const closed = campaigns.filter((c) => new Date(c.closing_date_time) <= now);

  if (isLoading) return <p className="p-8 text-on-dark">Loading…</p>;

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-8 space-y-5">
      <header className="flex items-baseline gap-4">
        <h1 className="text-4xl font-bold text-on-dark">Elections</h1>
        <p className="text-lg font-semibold text-on-dark">
          {live.length} live · {campaigns.length - live.length} others
        </p>
      </header>

      {live.map((c) => (
        <LiveCard key={c.campaign_id} campaign={c} />
      ))}

      <Section label="UPCOMING" items={upcoming} />
      <Section label="CLOSED" items={closed} />
    </main>
  );
}
