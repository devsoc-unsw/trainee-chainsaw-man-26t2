import axios from "axios";
import type {
  Candidate,
  CreateCandidateRequest,
  CreateCandidateResponse,
  CreateRoleRequest,
  CreateRoleResponse,
  Role,
  UpdateCandidateRequest,
  UpdateRoleRequest,
} from "@/lib/apiTypes";

export const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  withCredentials: true,
});

export async function getRoles(campaignId: string): Promise<Array<Role>> {
  const { data } = await api.get(`/campaigns/${campaignId}/roles`);
  return data;
}

export async function createRole(
  campaignId: string,
  role: CreateRoleRequest,
): Promise<CreateRoleResponse> {
  const { data } = await api.post(`/campaigns/${campaignId}/roles`, role);
  return data;
}

export async function updateRole(
  campaignId: string,
  roleId: string,
  changes: UpdateRoleRequest,
): Promise<void> {
  await api.patch(`/campaigns/${campaignId}/roles/${roleId}`, changes);
}

export async function deleteRole(
  campaignId: string,
  roleId: string,
): Promise<void> {
  await api.delete(`/campaigns/${campaignId}/roles/${roleId}`);
}

export async function getCandidates(
  campaignId: string,
): Promise<Array<Candidate>> {
  const { data } = await api.get(`/campaigns/${campaignId}/candidates`);
  return data;
}

export async function createCandidate(
  campaignId: string,
  candidate: CreateCandidateRequest,
): Promise<CreateCandidateResponse> {
  const { data } = await api.post(
    `/campaigns/${campaignId}/candidates`,
    candidate,
  );
  return data;
}

export async function updateCandidate(
  campaignId: string,
  candidateId: string,
  changes: UpdateCandidateRequest,
): Promise<void> {
  await api.patch(
    `/campaigns/${campaignId}/candidates/${candidateId}`,
    changes,
  );
}

export async function deleteCandidate(
  campaignId: string,
  candidateId: string,
): Promise<void> {
  await api.delete(`/campaigns/${campaignId}/candidates/${candidateId}`);
}