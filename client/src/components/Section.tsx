import { Card } from "./Card";
import type { Campaign } from "@/routes/_authed/dashboard";

export function Section({
  label,
  items,
}: {
  label: string;
  items: Campaign[];
}) {
  return (
    <Card className="overflow-hidden">
      <h2 className="p-3 text-xs font-bold tracking-widest text-statusLabel">
        {label}
      </h2>
      {items.map((c) => (
        <div
          key={c.campaign_id}
          className="flex justify-between font-medium border-t border-black/10 px-6 py-5"
        >
          <span>{c.title}</span>
        </div>
      ))}
    </Card>
  );
}
