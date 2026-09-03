import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/Card";
import { Field, TextArea } from "@/components/Form";

interface Campaign {
  campaign_id: string;
  title: string;
  description: string;
  publicise_results: boolean;
  opening_date_time: string | null;
  closing_date_time: string | null;
  in_person: boolean;
  location: string;
}

// TODO: delete between TODO lines since just for testing
async function fetchCampaign(campaignId: string): Promise<Campaign> {
  await new Promise((r) => setTimeout(r, 200));
  return {
    campaign_id: campaignId,
    title: "2026 Executive Election",
    description: "Annual election for the society executive team.",
    publicise_results: false,
    opening_date_time: null,
    closing_date_time: null,
    in_person: false,
    location: "",
  };
}

async function patchCampaign(campaignId: string, body: Partial<Campaign>) {
  await new Promise((r) => setTimeout(r, 200));
  console.log("patchCampaign", campaignId, body);
}
// TODO

// TODO: uncomment following with query
/*
async function fetchCampaign(campaignId: string): Promise<Campaign> {
  const res = await fetch(`/campaigns/${campaignId}`);
  if (!res.ok) throw new Error("Couldn't load this election.");
  return res.json();
}

async function patchCampaign(campaignId: string, body: Partial<Campaign>) {
  const res = await fetch(`/campaigns/${campaignId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("That didn't save. Try again.");
}
*/

export const Route = createFileRoute("/_authed/elections/$electionId/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { electionId } = Route.useParams();
  const [campaign, setCampaign] = useState<Campaign | null>(null);

  // TODO: delete between TODO lines since just for testing
  useEffect(() => {
    fetchCampaign(electionId).then(setCampaign);
  }, [electionId]);
  // TODO

  // TODO: uncomment following with query
  /*
  const { data: campaign } = useQuery({
    queryKey: ["campaign", electionId],
    queryFn: () => fetchCampaign(electionId),
  });
  */

  if (!campaign) return <p className="text-xs text-muted/60">Loading…</p>;

  return <ElectionOverview key={campaign.campaign_id} campaign={campaign} />;
}

function ElectionOverview({ campaign }: { campaign: Campaign }) {
  const [draft, setDraft] = useState(campaign);
  const [locationTouched, setLocationTouched] = useState(false);
  const update = <K extends keyof Campaign>(key: K, value: Campaign[K]) =>
    setDraft({ ...draft, [key]: value });
  const save = <K extends keyof Campaign>(key: K) => {
    if (draft[key] === campaign[key]) return;
    patchCampaign(draft.campaign_id, { [key]: draft[key] });
  };

  return (
    <div className="w-full space-y-3">
      <Card className="p-4 space-y-2">
        <Field
          label="Title"
          placeholder="Input field"
          value={draft.title}
          onChange={(e) => update("title", e.target.value)}
          onBlur={() => save("title")}
          error={draft.title.trim() ? undefined : "Title can't be empty"}
        />

        <TextArea
          label="Description"
          placeholder="What this election is for and who can vote."
          value={draft.description}
          onChange={(e) => update("description", e.target.value)}
          rows={3}
          maxLength={200}
          hint={`${draft.description.length}/200`}
          onBlur={() => save("description")}
          error={draft.description.trim() ? undefined : "Description can't be empty"}
        />

        <label className="flex items-start gap-2 pt-3 text-xs text-neutral-800">
          <input
            type="checkbox"
            checked={draft.publicise_results}
            onChange={(e) => {
              update("publicise_results", e.target.checked);
              patchCampaign(draft.campaign_id, { publicise_results: e.target.checked });
            }}
            className="h-4 w-4 rounded border border-muted/40 bg-input accent-blue"
          />
          <span>
            Publicise results
            <span className="block text-muted/60">
              Results will be made after closing date and time
            </span>
          </span>
        </label>
      </Card>

      <Card className="p-4">
        <label className="flex items-center gap-2 text-xs text-neutral-800">
          <input
            type="checkbox"
            checked={draft.in_person}
            onChange={(e) => {
              update("in_person", e.target.checked);
              patchCampaign(draft.campaign_id, { in_person: e.target.checked });
            }}
            className="h-4 w-4 rounded border border-muted/40 bg-input accent-blue"
          />
          In person
        </label>

        {draft.in_person && (
          <div className="mt-3 ml-6">
            <Field
              label="Location"
              placeholder="Input field"
              value={draft.location}
              onChange={(e) => update("location", e.target.value)}
              onBlur={() => {
                setLocationTouched(true);
                save("location");
              }}
              error={
                locationTouched && !draft.location.trim()
                  ? "Add a location for in-person voting"
                  : undefined
              }
            />
          </div>
        )}
      </Card>
    </div>
  );

}