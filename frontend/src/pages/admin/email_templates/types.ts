
// Type definitions for email templates


export interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  body: string;
  category: string;
  createdAt: string;
  updatedAt: string;
 }
 
 
 export interface TemplateVariable {
  key: string;
  description: string;
  example: string;
 }
 
 
 export interface TemplateCategory {
  value: string;
  label: string;
 }
 
 
 export interface FormData {
  name: string;
  subject: string;
  body: string;
  category: string;
 }
 
 
 // Dummy data for preview
 export const previewData = {
  name: "Sarah Chen",
  role: "Marketing Director",
  organisation_name: "DevSoc",
  campaign_name: "DevSoc Executive Recruitment 2024",
  expiry_date: "March 30, 2024",
 }
 