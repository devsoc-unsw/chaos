export type Status = "pending" | "successful" | "rejected";

export interface Applicant {
  id: number;
  name: string;
  zid: string;
  status: Status;
  role: string;
}

export interface StatusOption {
  value: string;
  label: string;
}

export const ROLE_OPTIONS: string[] = [
  "Software Engineer",
  "Product Manager",
  "Designer",
  "Data Scientist",
  "Marketing Specialist",
  "Sales Representative",
];

export const SAMPLE_APPLICANTS: Applicant[] = [
  { id: 1, name: "Alice Johnson", zid: "z1234567", status: "pending", role: "" },
  { id: 2, name: "Bob Smith", zid: "z2345678", status: "successful", role: "Software Engineer" },
  { id: 3, name: "Carol Brown", zid: "z3456789", status: "rejected", role: "" },
  { id: 4, name: "David Wilson", zid: "z4567890", status: "pending", role: "" },
  { id: 5, name: "Emma Davis", zid: "z5678901", status: "successful", role: "Product Manager" },
  { id: 6, name: "Frank Miller", zid: "z6789012", status: "pending", role: "" },
  { id: 7, name: "Grace Lee", zid: "z7890123", status: "rejected", role: "" },
  { id: 8, name: "Henry Taylor", zid: "z8901234", status: "successful", role: "Designer" },
];

export const STATUS_OPTIONS: StatusOption[] = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "successful", label: "Successful" },
  { value: "rejected", label: "Rejected" }
];
