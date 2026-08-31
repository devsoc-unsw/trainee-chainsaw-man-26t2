import { Card } from "./Card";
import type { Campaign } from "@/routes/_authed/dashboard";

export function LiveCard({ campaign }: { campaign: Campaign }) {
    return (
        <Card className="p-6">
            <h2 className="text-lg font-semibold">{campaign.title}</h2>
            {
            //progress bar etc.
            }
        </Card>
    )
}