import { lazy } from "react";
import { Route } from "react-router-dom";

const Admin = lazy(() => import("./pages/admin"));
const ApplicationPage = lazy(() => import("./pages/application_page"));
const AuthSuccess = lazy(() => import("./pages/auth_success"));
const CampaignCreate = lazy(() => import("./pages/create_campaign"));
const DashboardPage = lazy(() => import("./pages/dashboard"));
const FinaliseCandidates = lazy(
  () => import("./pages/admin/review/finalise_candidates")
);
const LandingPage = lazy(() => import("./pages/landing"));
const Marking = lazy(() => import("./pages/admin/review/marking"));
const Rankings = lazy(() => import("./pages/admin/review/rankings"));
const Review = lazy(() => import("./pages/admin/review"));
const SignupPage = lazy(() => import("./pages/signup"));

const routes = [
  <Route key="dashboard" path="/dashboard" element={<DashboardPage />} />,
  <Route key="auth" path="/auth/success" element={<AuthSuccess />} />,
  <Route key="signup" path="/signup" element={<SignupPage />} />,
  <Route key="landing" path="/" element={<LandingPage />} />,
  <Route key="review" path="/admin/review/:campaignSlug" element={<Review />}>
    <Route key="marking" path=":roleSlug/marking" element={<Marking />} />,
    <Route key="rankings" path=":roleSlug/rankings" element={<Rankings />} />,
    <Route
      key="finalise"
      path=":roleSlug/finalise"
      element={<FinaliseCandidates />}
    />
    ,
  </Route>,
  <Route key="Admin" path="/Admin" element={<Admin />} />,
  <Route
    key="create-campaign"
    path="/Admin/campaign/create/:orgSlug"
    element={<CampaignCreate />}
  />,
  <Route
    key="ApplicationPage"
    path="/:organisationSlug/:campaignSlug/application"
    element={<ApplicationPage />}
  />,
];

export default routes;
