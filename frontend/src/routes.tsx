import { lazy } from "react";
import { Route } from "react-router-dom";

const Admin = lazy(() => import("./pages/admin"));
const ApplicationPage = lazy(() => import("./pages/application_page"));
const AuthSuccess = lazy(() => import("./pages/auth_success"));
const CampaignCreate = lazy(() => import("./pages/create_campaign"));
const DashboardPage = lazy(() => import("./pages/dashboard"));
const FinaliseCandidates = lazy(() => import("./pages/finalise_candidates"));
const LandingPage = lazy(() => import("./pages/landing"));
const Marking = lazy(() => import("./pages/review/marking"));
const Rankings = lazy(() => import("./pages/review/rankings"));
const Review = lazy(() => import("./pages/review"));
const SignupPage = lazy(() => import("./pages/signup"));

const routes = [
  <Route key="dashboard" path="/dashboard" element={<DashboardPage />} />,
  <Route key="auth" path="/auth/callback" element={<AuthSuccess />} />,
  <Route key="signup" path="/signup" element={<SignupPage />} />,
  <Route key="landing" path="/" element={<LandingPage />} />,
  <Route key="review" path="/review/:campaignId" element={<Review />}>
    <Route key="marking" path=":roleId/marking" element={<Marking />} />,
    <Route key="rankings" path=":roleId/rankings" element={<Rankings />} />,
  </Route>,
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
    path="/application/:campaignId"
    element={<ApplicationPage />}
  />,
];

export default routes;
