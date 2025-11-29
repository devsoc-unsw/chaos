import { UserDetails } from "./user";

export interface ApplicationDetails {
    id: string;
    campaign_id: string;
    user: UserDetails;
    status: ApplicationStatus;
    private_status: ApplicationStatus;
    applied_roles: ApplicationAppliedRoleDetails[];
}

export type ApplicationStatus = "Pending" | "Rejected" | "Successful";

export interface ApplicationAppliedRoleDetails {
    campaign_role_id: string;
    role_name: string;
    preference: number;
}