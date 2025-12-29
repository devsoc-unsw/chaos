import { apiRequest } from "@/lib/api";
import { AppMessage } from "./app";

export type InviteDetails = {
  organisation_id: string;
  organisation_name: string;
  email: string;
  expires_at: string;
  used: boolean;
  expired: boolean;
};

export async function getInvite(code: string): Promise<InviteDetails> {
  return await apiRequest<InviteDetails>(`/api/v1/invite/${code}`);
}

export async function acceptInvite(code: string): Promise<AppMessage> {
  return await apiRequest<AppMessage>(`/api/v1/invite/${code}`, {
    method: "POST",
  });
}


