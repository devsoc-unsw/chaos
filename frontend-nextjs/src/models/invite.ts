import { apiRequest } from "@/lib/api";
import type { QueryKey } from "@tanstack/react-query";
import { AppMessage } from "./app";

export type InviteDetails = {
  organisation_id: string;
  organisation_name: string;
  email: string;
  expires_at: string;
  used: boolean;
  expired: boolean;
};

type InviteResponse = { message: InviteDetails };

/**
 * Gets the invite details for a given invite code.
 * @param code - The invite code
 * @returns The invite details
 */
export async function getInvite(code: string): Promise<InviteDetails> {
  const res = await apiRequest<InviteResponse>(`/api/v1/invite/${code}`);
  return res.message;
}

/**
 * Accepts an invite for the current authenticated user.
 * @param code - The invite code
 * @returns The app message
 */
export async function acceptInvite(code: string): Promise<AppMessage> {
  return await apiRequest<AppMessage>(`/api/v1/invite/${code}`, {
    method: "POST",
  });
}

/**
 * Gets the query key for the invite.
 * @param code - The invite code
 * @returns The query key
 */
export const inviteQueryKey = (code: string): QueryKey => ["invite", code];

/**
 * Gets the query options for the invite.
 * @param code - The invite code
 * @returns The query options
 */
export const inviteQueryOptions = (code: string) => ({
  queryKey: inviteQueryKey(code),
  queryFn: () => getInvite(code),
});


