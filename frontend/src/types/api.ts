/* eslint-disable @typescript-eslint/naming-convention */
type JsonPrimitive = string | number | boolean | null;
type JsonMap = {
  // eslint-disable-next-line no-use-before-define
  [key: string]: JsonPrimitive | JsonMap | JsonArray;
};
type JsonArray = Array<JsonPrimitive | JsonMap | JsonArray>;
export type Json = JsonPrimitive | JsonMap | JsonArray;

export type AuthenticateResponse = { token: string; name: string };
export type AuthenticateErrResponse =
  | "InvalidOAuthCode"
  | "GoogleOAuthInternalError"
  | {
      SignupRequired: {
        signup_token: string;
        name?: string;
      };
    };

export type Role = {
  id: number;
  campaign_id: number;
  name: string;
  description?: string;
  min_available: number;
  max_available: number;
  finalised: boolean;
  created_at: string;
  updated_at: string;
};

export type RoleInput = {
  name: string;
  description?: string;
  min_available: number;
  max_available: number;
  questions_for_role: number[];
};

export type RoleApplications = {
  applications: ApplicationResponse[];
};

export type Question = {
  id: number;
  role_ids: number[];
  title: string;
  description?: string;
  max_bytes: number;
  required: boolean;
  created_at: string;
  updated_at: string;
};

export type NewQuestion = {
  role_ids: number[];
  title: string;
  description?: string;
  max_bytes: number;
  required: boolean;
};

export type QuestionResponse = {
  id: number;
  role_ids: number[];
  title: string;
  description?: string;
  max_bytes: number;
  required: boolean;
};

export type QuestionInput = {
  title: string;
  description?: string;
  max_bytes?: number;
  required?: boolean;
};

export type AdminLevel = "ReadOnly" | "Director" | "Admin";

export type ApplicationStatus = "Draft" | "Pending" | "Rejected" | "Success";

export type Application = {
  id: number;
  user_id: number;
  role_id: number;
  status: ApplicationStatus;
};

export type ApplicationResponse = {
  id: number;
  user_id: number;
  user_email: string;
  user_zid: string;
  user_display_name: string;
  user_degree_name: string;
  user_degree_starting_year: number;
  role_id: number;
  status: ApplicationStatus;
  private_status: ApplicationStatus;
  created_at: string;
  updated_at: string;
};

export type ApplicationAnswer = {
  id: number;
  application_id: number;
  question_id: number;
  description: string;
  created_at: string;
  updated_at: string;
};

export type ApplicationRating = {
  id: number;
  application_id: number;
  rater_user_id: number;
  rating: number;
  created: string;
  updated_at: string;
};

export type Campaign = {
  id: number;
  organisation_id: number;
  name: string;
  cover_image: string;
  description: string;
  starts_at: string;
  ends_at: string;
  published: boolean;
  created_at: string;
  updated_at: string;
};

export type CampaignInfo = {
  id: number;
  name: string;
  cover_image?: string;
  starts_at: string;
  ends_at: string;
};

export type CampaignWithRoles = {
  campaign: Campaign;
  roles: Role[];
  questions: Question[];
  applied_for: [number, ApplicationStatus][];
};

export type NewCampaignInput = {
  organisation_id: number;
  name: string;
  description: string;
  starts_at: string;
  ends_at: string;
  published: boolean;
};

export type LogoError =
  | "Unauthorized"
  | "ImageDeletionFailure"
  | "ImageStoreFailure";

export type Organisation = {
  id: number;
  name: string;
  logo?: string;
  created_at: string;
  updated_at: string;
};

export type OrganisationUserInfo = {
  id: number;
  display_name: string;
  role: AdminLevel;
};

export type OrganisationInfo = {
  id: number;
  name: string;
  logo?: string;
  members: OrganisationUserInfo[];
  campaigns: CampaignInfo[];
};

// Based
export type UserGender = "Male" | "Female" | "Unspecified";

// Will add ticket to reflect new response
export type UserResponse = {
  email: string;
  zid: string;
  display_name: string;
  degree_name: string;
  degree_starting_year: number;
};

export type PostCommentRespone = {
  id: number;
  application_id: number;
  commenter_user_id: number;
  description: string;
  created_at: string;
  updated_at: string;
};
