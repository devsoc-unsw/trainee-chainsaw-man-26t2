import { useQuery, queryKey } from "@tanstack/react-query";

const queryKey = (tokenId: string) => [
    "voter-campaign",
    tokenId
]

async function voterGetCampaignInformation(
    tokenId: string
): Promise<T>{
    const {} = await fetch(`/vote/${tokenId}`)
}


export function useVoterGetCampaignInformation(tokenId: string) {
    return useQuery({
        queryKey: queryKey(tokenId),
        queryFn: () => voterGetCampaignInformation(tokenId),
    });
}