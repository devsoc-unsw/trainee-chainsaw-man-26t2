import type { VotingCampaign, VotingSelection } from "./apiTypes"
import { backendUrl } from "./utils";
import axios from "axios";


/**
 * Make a GET request to the backend and return the JSON response.
 */
async function get<T>(path: string): Promise<T> {
  return (await axios.get(`${backendUrl()}${path}`)).data;
}

/**
 * Make an authenticated POST request to the backend and return the JSON response.
 */
async function post<T>(path: string, body: object): Promise<T> {
  return (
    await axios.post(`${backendUrl()}${path}`, body)
  ).data;
}

/**
 * Make an authenticated GET request to the backend and return the JSON response.
 */
async function getAuthed<T>(path: string): Promise<T> {
  return (await axios.get(`${backendUrl()}${path}`, { withCredentials: true }))
    .data;
}

/**
 * Make an authenticated GET request to the backend using the internal API key and return the JSON response.
 */
async function getAuthedInternal<T>(path: string): Promise<T> {
  return (
    await axios.get(`${backendUrl()}${path}`, {
      headers: { Authorization: `Bearer ${process.env.INTERNAL_API_KEY}` },
      withCredentials: true,
    })
  ).data;
}

/**
 * Make an authenticated POST request to the backend and return the JSON response.
 */
async function postAuthed<T>(path: string, body: object): Promise<T> {
  return (
    await axios.post(`${backendUrl()}${path}`, body, { withCredentials: true })
  ).data;
}

/**
 * Make an authenticated PATCH request to the backend and return the JSON response.
 */
async function patchAuthed<T>(path: string, body: object): Promise<T> {
  return (
    await axios.patch(`${backendUrl()}${path}`, body, { withCredentials: true })
  ).data;
}

/**
 * Make an authenticated DELETE request to the backend and return the JSON response.
 */
async function deleteAuthed<T>(path: string): Promise<T> {
  return (
    await axios.delete(`${backendUrl()}${path}`, { withCredentials: true })
  ).data;
}

/**
 * Make a GET request retrieving the election details from User who has TokenId
 *
 */

export async function getVoterCampaignInformation(tokenId: string): Promise<VotingCampaign> {
    return await get(`/vote/${tokenId}`)
}

/**
 * Make a POST request submitting a User's Ballot
 * 
 */
export async function postVoterCampaignInformation(tokenId: string, body: VotingSelection) {
    await post(`/vote/${tokenId}`, body)
}