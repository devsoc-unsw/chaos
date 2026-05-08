import {
  ApplicationRatingSummary,
  ApplicationStatus,
} from "@/models/application";
import { RatingCategory, RatingDetails } from "@/models/rating";
import { CampaignDetails, RoleDetails } from "@/models/campaign";

// Mock Campaign Data
export const mockCampaign: CampaignDetails = {
  id: 1,
  campaign_slug: "devsoc-subcom-2026",
  name: "DevSoc Subcommittee Application 2026",
  organisation_id: "7451971096510861312",
  organisation_slug: "devsoc-app",
  organisation_name: "DevSoc",
  contact_email: "hr-directors@devsoc.app",
  website_url: "https://devsoc.app",
  cover_image: null,
  cover_image_url: null,
  description: "Join our engineering team for the summer of 2026!",
  starts_at: "2026-05-01T00:00:00Z",
  ends_at: "2026-06-30T23:59:59Z",
  published: true,
  max_roles_per_application: 3,
  interview_period_starts_at: new Date("2026-07-01"),
  interview_period_ends_at: new Date("2026-07-15"),
  interview_format: "virtual",
  outcomes_released_at: new Date("2026-08-01"),
  application_requirements:
    "Doing a Computer Science degree or related field",
};

// Mock Roles Data
export const mockRoles: RoleDetails[] = [
  {
    id: "role-1",
    campaign_id: "7451971096561192960",
    name: "Chaos",
    description: "Hiring system i guess, we're deploying!",
    min_available: 5,
    max_available: 10,
    finalised: true,
  },
  {
    id: "role-2",
    campaign_id: "7451971096561192960",
    name: "Notangles",
    description: "Better than crossangles!!",
    min_available: 3,
    max_available: 8,
    finalised: true,
  },
  {
    id: "role-3",
    campaign_id: "7451971096561192960",
    name: "Warchest",
    description: "Another cool project",
    min_available: 2,
    max_available: 5,
    finalised: true,
  },
];

// Mock Rating Categories
export const mockRatingCategories: RatingCategory[] = [
  {
    id: "category-1",
    campaign_id: "7451971096561192960",
    name: "Gooning",
  },
  {
    id: "category-2",
    campaign_id: "7451971096561192960",
    name: "Doomscroll",
  },
  {
    id: "category-3",
    campaign_id: "7451971096561192960",
    name: "Frontend",
  },
  {
    id: "category-4",
    campaign_id: "campaign-123",
    name: "Backend",
  },
];

// Mock Rating Details
const mockRatingDetailsData: RatingDetails[] = [
  {
    id: "rating-1",
    rater_id: "rater-1",
    rater_name: "Alice Johnson",
    comment: "Strong technical background, great communication skills",
    category_ratings: [
      {
        id: "cr-1-1",
        campaign_rating_category_id: "category-1",
        category_name: "Gooning",
        rating: 9,
      },
      {
        id: "cr-1-2",
        campaign_rating_category_id: "category-2",
        category_name: "Doomscroll",
        rating: 8,
      },
      {
        id: "cr-1-3",
        campaign_rating_category_id: "category-3",
        category_name: "Frontend",
        rating: 9,
      },
      {
        id: "cr-1-4",
        campaign_rating_category_id: "category-4",
        category_name: "Backend",
        rating: 8,
      },
    ],
    updated_at: "2026-04-15T10:30:00Z",
  },
  {
    id: "rating-2",
    rater_id: "rater-2",
    rater_name: "Bob Smith",
    comment: "Good fundamentals, needs more experience with distributed systems",
    category_ratings: [
      {
        id: "cr-2-1",
        campaign_rating_category_id: "category-1",
        category_name: "Gooning",
        rating: 7,
      },
      {
        id: "cr-2-2",
        campaign_rating_category_id: "category-2",
        category_name: "Doomscroll",
        rating: 7,
      },
      {
        id: "cr-2-3",
        campaign_rating_category_id: "category-3",
        category_name: "Frontend",
        rating: 8,
      },
      {
        id: "cr-2-4",
        campaign_rating_category_id: "category-4",
        category_name: "Backend",
        rating: 7,
      },
    ],
    updated_at: "2026-04-16T14:20:00Z",
  },
];

// Mock Application Rating Summary Data
export const mockApplicationRatingSummary: ApplicationRatingSummary[] = [
  {
    application_id: "app-1",
    applied_roles: ["role-1", "role-2"],
    user_name: "John Doe",
    user_email: "john.doe@example.com",
    status: "Pending",
    private_status: "Successful",
    updated_at: "2026-04-10T12:00:00Z",
    ratings: mockRatingDetailsData,
  },
  {
    application_id: "app-2",
    applied_roles: ["role-2", "role-3"],
    user_name: "Jane Smith",
    user_email: "jane.smith@example.com",
    status: "Pending",
    private_status: "Successful",
    updated_at: "2026-04-11T09:30:00Z",
    ratings: [
      {
        id: "rating-3",
        rater_id: "rater-1",
        rater_name: "Alice Johnson",
        comment: "Excellent frontend skills, very creative",
        category_ratings: [
          {
            id: "cr-3-1",
            campaign_rating_category_id: "category-1",
            category_name: "Gooning",
            rating: 9,
          },
          {
            id: "cr-3-2",
            campaign_rating_category_id: "category-2",
            category_name: "Doomscroll",
            rating: 9,
          },
          {
            id: "cr-3-3",
            campaign_rating_category_id: "category-3",
            category_name: "Frontend",
            rating: 8,
          },
          {
            id: "cr-3-4",
            campaign_rating_category_id: "category-4",
            category_name: "Backend",
            rating: 9,
          },
        ],
        updated_at: "2026-04-15T11:20:00Z",
      },
    ],
  },
  {
    application_id: "app-3",
    applied_roles: ["role-1"],
    user_name: "Michael Brown",
    user_email: "michael.brown@example.com",
    status: "Pending",
    private_status: "Rejected",
    updated_at: "2026-04-12T16:45:00Z",
    ratings: [
      {
        id: "rating-4",
        rater_id: "rater-2",
        rater_name: "Bob Smith",
        comment: "Needs more backend experience",
        category_ratings: [
          {
            id: "cr-4-1",
            campaign_rating_category_id: "category-1",
            category_name: "Gooning",
            rating: 5,
          },
          {
            id: "cr-4-2",
            campaign_rating_category_id: "category-2",
            category_name: "Doomscroll",
            rating: 6,
          },
          {
            id: "cr-4-3",
            campaign_rating_category_id: "category-3",
            category_name: "Frontend",
            rating: 5,
          },
          {
            id: "cr-4-4",
            campaign_rating_category_id: "category-4",
            category_name: "Backend",
            rating: 6,
          },
        ],
        updated_at: "2026-04-16T13:00:00Z",
      },
    ],
  },
  {
    application_id: "app-4",
    applied_roles: ["role-3"],
    user_name: "Sarah Wilson",
    user_email: "sarah.wilson@example.com",
    status: "Pending",
    private_status: "Successful",
    updated_at: "2026-04-13T11:15:00Z",
    ratings: [],
  },
  {
    application_id: "app-5",
    applied_roles: ["role-1", "role-3"],
    user_name: "David Taylor",
    user_email: "david.taylor@example.com",
    status: "Pending",
    private_status: "Pending",
    updated_at: "2026-04-14T15:30:00Z",
    ratings: [
      {
        id: "rating-5",
        rater_id: "rater-1",
        rater_name: "Alice Johnson",
        comment: null,
        category_ratings: [
          {
            id: "cr-5-1",
            campaign_rating_category_id: "category-1",
            category_name: "Gooning",
            rating: null,
          },
          {
            id: "cr-5-2",
            campaign_rating_category_id: "category-2",
            category_name: "Doomscroll",
            rating: 7,
          },
          {
            id: "cr-5-3",
            campaign_rating_category_id: "category-3",
            category_name: "Frontend",
            rating: null,
          },
          {
            id: "cr-5-4",
            campaign_rating_category_id: "category-4",
            category_name: "Backend",
            rating: 8,
          },
        ],
        updated_at: "2026-04-17T10:00:00Z",
      },
    ],
  },
];

// Mock Dictionary (i18n) Data
export const mockDict = {
  common: {
    back: "Back",
    roles: "Roles",
  },
  dashboard: {
    campaigns: {
      review_applications: "Review Applications",
      send_outcome_emails: "Send outcome emails",
      application_summary_page: {
        no_ratings: "No ratings available",
        filter_by_role: "Filter by role",
        all_roles: "All Roles",
      },
    },
  },
};

// Helper to create props for ApplicationSummary component
export const createApplicationSummaryProps = (
  campaignId: string = "campaign-123",
  orgId: string = "org-123",
) => ({
  campaignId,
  orgId,
  dict: mockDict,
});
