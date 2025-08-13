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

export type RoleWithDates = Role & {
  created_at: string;
  updated_at: string;
};

export type Role = {
  id: string;
  campaign_id: string;
  name: string;
  description?: string;
  min_available: number;
  max_available: number;
  finalised: boolean;
}

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

// models::application::ApplicationDetails
export type ApplicationDetails = {
  id: string;
  campaign_id: string;
  user: User;
  status: ApplicationStatus;
  private_status: ApplicationStatus;
  applied_roles: ApplicationAppliedRoleDetails[];
}

// models::application::ApplicationRoleDetails
export type ApplicationAppliedRoleDetails = {
  campaign_role_id: string;
  role_name: string;
}

export type Question = {
  id: string;
  role_ids: string[];
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

// models::question::Question
export type QuestionResponse = {
  id: string;
  title: string;
  description?: string;
  //common: boolean;
  //max_bytes: number;
  required: boolean;
  question_type: QuestionType;
  data: QuestionData;
  created_at: Date;
  updated_at: Date;
};

// models::question::QuestionType
export enum QuestionType {
  ShortAnswer = "ShortAnswer",
  MultiChoice = "MultiChoice",
  MultiSelect = "MultiSelect",
  DropDown = "DropDown",
  Ranking = "Ranking",
}

export type QuestionData = {
  options: {
    id: string,
    display_order: number,
    text: string
  }[];
}

export type QuestionInput = {
  title: string;
  description?: string;
  max_bytes?: number;
  required?: boolean;
};

// models::organisation::OrganisationRole
export type OrganisationRole = "User" | "Admin";

// models::application::ApplicationStatus
export type ApplicationStatus = "Draft" | "Pending" | "Completed";

// models::application::NewApplication
export type NewApplication = {
  applied_roles: ApplicationRole[];
}

// models::application::NewApplication
export type ApplicationRole = {
  campaign_role_id: string,
}

export type Application = {
  id: string;
  user_id: string;
  role_id: string;
  status: ApplicationStatus;
};

export type ApplicationResponse = {
  id: string;
  user_id: string;
  user_email: string;
  user_zid: string;
  user_display_name: string;
  user_degree_name: string;
  user_degree_starting_year: number;
  role_id: string;
  status: ApplicationStatus;
  private_status: ApplicationStatus;
  created_at: string;
  updated_at: string;
};

// models::answer::Answer
export type Answer = {
  id: string,
  question_id: string,
  answer_type: QuestionType,
  data: AnswerData,
  created_at: Date,
  updated_at: Date,
}

export type AnswerData = string | string[];

// export type AnswerData = 
// { type: QuestionType.ShortAnswer; value: string }   |
// { type: QuestionType.MultiChoice; value: number }   |
// { type: QuestionType.MultiSelect; value: number[] } |
// { type: QuestionType.DropDown; value: number }      |
// { type: QuestionType.Ranking; value: number[] }; 

export type ApplicationAnswer = {
  id: string;
  application_id: string;
  question_id: string;
  description: string;
  created_at: string;
  updated_at: string;
};

export type NewRating = {
  rating: number,
  comment?: string,
}

export type ApplicationRating = {
  id: string;
  rater_id: string;
  rater_name: string
  rating: number;
  comment?: string;
  updated_at: string;
};

// models::campaign::Campaign
export type CampaignWithDates = {
  id: string;
  slug: string
  organisation_id: string; // Changed to string to handle large integers
  name: string;
  cover_image: string;
  description: string;
  starts_at: string;
  ends_at: string;
  created_at: string;
  updated_at: string;
};

// models::campaign::CampaignDetails
export type Campaign = {
  id: string;
  slug: string;
  name: string;
  organisation_id: string; // Changed to string to handle large integers
  organisation_slug: string;
  organisation_name: string;
  cover_image: string;
  description: string;
  starts_at: string;
  ends_at: string;
}

export type CampaignInfo = {
  id: string;
  name: string;
  cover_image?: string;
  starts_at: string;
  ends_at: string;
};

export type CampaignWithRoles = {
  campaign: Campaign;
  roles: Role[];
  questions: Question[];
  applied_for: [string, ApplicationStatus][]; // [roleId, ApplicationStatus]
};

export type NewCampaignInput = {
  organisation_id: string; // Changed to string to handle large integers
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

export type newOrganisation = {
  admin: string,
  slug: string,
  name: string
};

export type Organisation = {
  id: string; // Changed to string to handle large integers
  slug: string
  name: string;
  logo?: string;
  created_at: string;
};

export type Member = {
  id: string;
  name: string;
  role: OrganisationRole;
};

export type OrganisationInfo = {
  id: string;
  name: string;
  logo?: string;
  members: Member[];
  campaigns: CampaignInfo[];
};

// Based
export type UserGender = "Male" | "Female" | "Unspecified";

// matches both models::user::User and models::user::UserDetails in the backend
export type User = {
  id: string;
  email: string;
  zid: string;
  name: string;
  pronouns: string;
  gender: string;
  degree_name: string;
  degree_starting_year: number;
  role?: UserRole
};

// models::user::UserRole
export enum UserRole {
  User,
  SuperUser
}

export type PostCommentRespone = {
  id: string;
  application_id: string;
  commenter_user_id: string;
  description: string;
  created_at: string;
  updated_at: string;
};
