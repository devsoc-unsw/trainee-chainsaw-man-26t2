import axios from "axios";
import { backendUrl } from "./utils";
import type { VotingCampaign, VotingSelection } from "./apiTypes"


/**
 * Make a GET request to the backend and return the JSON response.
 */
async function get<T>(path: string): Promise<T> {
  return (await axios.get<T>(`${backendUrl()}${path}`)).data;
}

/**
 * Make an POST request to the backend and return the JSON response.
 */
async function post<T>(path: string, body: object): Promise<T> {
  return (
    await axios.post<T>(`${backendUrl()}${path}`, body)
  ).data;
}

/**
 * Make a GET request retrieving the election details from User who has TokenId
 *
 */

export async function getVoterCampaignInformation(tokenId: string): Promise<VotingCampaign> {
    return await get<VotingCampaign>(`/vote/${tokenId}`)
}

/**
 * Make a POST request submitting a User's Ballot
 * 
 */
export async function postVoterCampaignInformation(tokenId: string, body: VotingSelection): Promise<void> {
    await post<VotingSelection>(`/vote/${tokenId}`, body)
}