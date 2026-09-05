import axios from "axios";
import type {
  CreateRoleRequest,
  CreateRoleResponse,
  Role,
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
