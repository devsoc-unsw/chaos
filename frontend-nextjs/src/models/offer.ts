import { apiRequest } from "@/lib";
import type { AppMessage } from "./app";

export type OfferStatus = "Draft" | "Sent" | "Accepted" | "Declined";

export interface Offer {
  id: string;
  campaign_id: string;
  application_id: string;
  email_template_id: string;
  role_id: string;
  expiry: string;
  status: OfferStatus;
}

export interface OfferDetails extends Offer {
  organisation_name: string;
  campaign_name: string;
  user_id: string;
  user_name: string;
  user_email: string;
  role_name: string;
  created_at: string;
}

export interface OfferReply {
  accept: boolean;
}

export interface OfferEmailPreview {
  subject: string;
  body: string;
}

export type CreateOfferRequest = Offer;

export async function getOffersByCampaign(
  campaignId: string,
): Promise<OfferDetails[]> {
  return apiRequest<OfferDetails[]>(
    `/api/v1/campaign/${campaignId}/offers`,
  );
}

export async function getOffer(offerId: string): Promise<OfferDetails> {
  return apiRequest<OfferDetails>(`/api/v1/offer/${offerId}`);
}

export async function replyToOffer(
  offerId: string,
  reply: OfferReply,
): Promise<AppMessage> {
  return apiRequest<AppMessage>(`/api/v1/offer/${offerId}`, {
    method: "POST",
    body: reply,
  });
}


