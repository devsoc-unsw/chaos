import React, { lazy } from "react";
import { Route } from "react-router-dom";

const LandingPage = lazy(() => import("./pages/landing"));
const DashboardPage = lazy(() => import("./pages/dashboard"));
const AuthSuccess = lazy(() => import("./pages/auth_success"));
const SignupPage = lazy(() => import("./pages/signup"));
const Marking = lazy(() => import("./pages/marking"));
const Rankings = lazy(() => import("./pages/rankings"));
const FinaliseCandidates = lazy(() => import("./pages/finalise_candidates"));
const Admin = lazy(() => import("./pages/admin"));
const CampaignCreate = lazy(() => import("./pages/create_campaign"));
const ApplicationPage = lazy(() => import("./pages/application_page"));

const routes = [
  <Route key="dashboard" path="/dashboard" element={<DashboardPage />} />,
  <Route key="auth" path="/auth/callback" element={<AuthSuccess />} />,
  <Route key="signup" path="/signup" element={<SignupPage />} />,
  <Route key="landing" path="/" element={<LandingPage />} />,
  <Route key="marking" path="/marking/:campaignId" element={<Marking />} />,
  <Route key="rankings" path="/rankings/:campaignId" element={<Rankings />} />,
  <Route
    key="finalise-candidates"
    path="/finalise_candidates"
    element={<FinaliseCandidates />}
  />,
  <Route key="Admin" path="/Admin" element={<Admin />} />,
  <Route
    key="create-campaign"
    path="/campaign/create/:orgId"
    element={<CampaignCreate />}
  />,
  <Route
    key="ApplicationPage"
    path="/application"
    element={<ApplicationPage />}
  />,
];

export default routes;
