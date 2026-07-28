export interface EmailTemplateVars {
  name: string;
  role: string;
  organisation_name: string;
  campaign_name: string;
  expiry_date: string;
  offer_link?: string;
}

export interface RenderedEmail {
  subject: string;
  html: string;
}