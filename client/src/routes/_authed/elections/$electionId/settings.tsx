import { createFileRoute } from "@tanstack/react-router";
import { Field, SelectField, type Option } from "@/components/Form";
import { Card } from "@/components/Card";
import { useState } from "react";
// TODO: uncomment out following with query
/* 
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { campaignQuery } from "@/queries/campaigns"; 
*/

export const Route = createFileRoute("/_authed/elections/$electionId/settings")(
  {
    component: RouteComponent,
  },
);

type Settings = {
  counting_method: string | null;
  tie_breaking_method: string | null;
  quorum_percentage: string;
  quorum_flat_number: string;
};

type SettingsPatch = Partial<{
  counting_method: string | null;
  tie_breaking_method: string | null;
  quorum_percentage: number;
  quorum_flat_number: number;
}>;

const EMPTY: Settings = {
  counting_method: null,
  tie_breaking_method: null,
  quorum_percentage: "0",
  quorum_flat_number: "0",
};

const COUNTING_METHODS: Option[] = [
  { value: "first_past_the_post", label: "First past the post" },
  { value: "instant_runoff", label: "Instant-runoff (preferential)" },
];

const TIE_BREAKING_METHODS: Option[] = [
  { value: "countback", label: "Countback on earlier preferences" },
  { value: "manual", label: "Pause and let an admin decide" },
];

const QUORUM_PERCENTAGES: Option[] = [0, 10, 20, 25, 33, 50, 66, 75].map((n) => ({
  value: String(n),
  label: `${n}%`,
}));

// TODO: delete between TODO since it's just for testing
const MOCK: Record<string, Partial<Settings>> = {
  "1": {
    counting_method: "instant_runoff",
    tie_breaking_method: "countback",
    quorum_percentage: "50",
  },
};

function useSettings(campaign_id: string): Settings {
  return { ...EMPTY, ...MOCK[campaign_id] };
}

function useSaveSettings(_campaign_id: string) {
  return (patch: SettingsPatch) => console.log("PATCH", patch);
}
// TODO

// TODO: uncomment out following with query
/*
function useSettings(campaign_id: string): Settings {
  const { data } = useSuspenseQuery(campaignQuery(campaign_id));
  return {
    ...EMPTY,
    ...data,
    quorum_percentage: String(data.quorum_percentage ?? 0),
    quorum_flat_number: String(data.quorum_flat_number ?? 0),
  };
}

function useSaveSettings(campaign_id: string) {
  const queryClient = useQueryClient();
  const { mutate } = useMutation({
    mutationFn: (patch: SettingsPatch) =>
      fetch(`/api/campaigns/${campaign_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["campaigns", campaign_id] }),
  });
  return mutate;
}
*/

function RouteComponent() {
  const { electionId } = Route.useParams();
  const loaded = useSettings(electionId);
  const [settings, setSettings] = useState(loaded);
  const save = useSaveSettings(electionId);

  const update =
    <K extends keyof Settings>(key: K) =>
      (value: Settings[K]) =>
        setSettings((s) => ({ ...s, [key]: value }));

  return (
    <div key={electionId} className="w-full space-y-3">
      <Card className="space-y-2 p-4">
        <SelectField
          label="Choose your preferred way of counting"
          options={COUNTING_METHODS}
          value={settings.counting_method}
          onChange={(v) => {
            update("counting_method")(v);
            save({ counting_method: v });
          }}
        />
      </Card>

      <Card className="space-y-2 p-4">
        <SelectField
          label="Choose your tie-breaking method"
          options={TIE_BREAKING_METHODS}
          value={settings.tie_breaking_method}
          onChange={(v) => {
            update("tie_breaking_method")(v);
            save({ tie_breaking_method: v });
          }}
        />
      </Card>

      <Card className="space-y-2 p-4">
        <SelectField
          label="Quorum percentage (we will use the lower one)"
          options={QUORUM_PERCENTAGES}
          value={settings.quorum_percentage}
          onChange={(v) => {
            update("quorum_percentage")(v ?? "0");
            save({ quorum_percentage: Number(v ?? 0) });
          }}
        />
        <Field
          label="Quorum flat number (we will use the lower one)"
          type="text"
          inputMode="numeric"
          value={settings.quorum_flat_number}
          error={settings.quorum_flat_number === "" ? "Enter 0 for no quorum" : undefined}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "" || /^\d+$/.test(v)) update("quorum_flat_number")(v);
          }}
          onBlur={() => {
            if (settings.quorum_flat_number === "") return update("quorum_flat_number")("0");
            save({ quorum_flat_number: Number(settings.quorum_flat_number) });
          }}
        />
      </Card>
    </div>
  );
}
