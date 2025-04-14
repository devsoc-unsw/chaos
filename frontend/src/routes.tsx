import InterviewBooking from "pages/interview_booking/interview_booking";
import InterviewBooking2 from "pages/interview_booking/interview_page_2";
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
  <Route key="auth" path="/auth/callback" element={<AuthSuccess />} />,
  <Route key="signup" path="/signup" element={<SignupPage />} />,
  <Route key="landing" path="/" element={<LandingPage />} />,
  <Route key="review" path="/admin/review/:campaignId" element={<Review />}>
    <Route key="marking" path=":roleId/marking" element={<Marking />} />,
    <Route key="rankings" path=":roleId/rankings" element={<Rankings />} />,
    <Route
      key="finalise"
      path=":roleId/finalise"
      element={<FinaliseCandidates />}
    />
    ,
  </Route>,
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
  <Route
    key="interview-booking"
    path="/interview-booking"
    element={<InterviewBooking />}
  />,
  <Route
    key="interview-booking2"
    path="/interview-booking2"
    element={<InterviewBooking2 />}
  />,
];

export default routes;
