import { useEffect, useState } from "react";
import { Card } from "./Card";
import type { Campaign } from "@/routes/_authed/dashboard";

const MS_PER_MINUTE = 60000;
const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 1440;

const pad = (n: number) => String(n).padStart(2, "0");

function formatTimeRemaining(closingDateTime: string) {
  const total = Math.floor(
    (new Date(closingDateTime).getTime() - Date.now()) / MS_PER_MINUTE,
  );
  if (total <= 0) return "Closed";

  const days = Math.floor(total / MINUTES_PER_DAY);
  const hours = Math.floor((total % MINUTES_PER_DAY) / MINUTES_PER_HOUR);
  const minutes = total % MINUTES_PER_HOUR;

  return days > 0
    ? `${days}d ${hours}h ${pad(minutes)}m`
    : `${hours}h ${pad(minutes)}m`;
}

export function LiveCard({ campaign }: { campaign: Campaign }) {
  // re-render so TimeRemaining is current
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setTick((t) => t + 1);
    }, MS_PER_MINUTE);
    return () => {
      clearInterval(id);
    };
  }, []);

  const handleCloseNow = () => {
    // TODO: needs query and validation(e.g. "Are you sure you want to close now")
  };

  const turnout =
    campaign.voter_count != null &&
    campaign.voted_count != null &&
    campaign.voter_count > 0
      ? Math.round((campaign.voted_count / campaign.voter_count) * 100)
      : null;

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-medium">{campaign.title}</h2>
          <p className="text-sm text-muted">
            Closes in {formatTimeRemaining(campaign.closing_date_time)}
          </p>
        </div>

        {/* TODO: this button changes closing_date_time to current, but requires query*/}
        <button
          onClick={handleCloseNow}
          className="rounded-full border border-black px-4 py-2 text-xs"
        >
          Close Now
        </button>
      </div>

      {/* TODO: need voter_count and voted_count. Quorum isn't defined anywhere*/}
      {turnout != null && (
        <>
          <div className="mt-6 flex justify-end text-sm text-muted">
            <span>Turnout: {turnout}%</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-card-muted">
            <div
              className="h-2 rounded-full bg-progress"
              style={{ width: `${turnout}%` }}
            />
          </div>
        </>
      )}
    </Card>
  );
}
