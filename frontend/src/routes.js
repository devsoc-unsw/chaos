import React, { lazy } from "react";
import { Route } from "react-router-dom";

const LandingPage = lazy(() => import("./pages/landing"));
const DashboardPage = lazy(() => import("./pages/dashboard"));
const AuthSuccess = lazy(() => import("./pages/auth_success"));
const SignupPage = lazy(() => import("./pages/signup"));
const Marking = lazy(() => import("./pages/marking"));
const Rankings = lazy(() => import("./pages/rankings"));

const routes = [
  <Route key="dashboard" path="/dashboard" element={<DashboardPage />} />,
  <Route key="auth" path="/auth/callback" element={<AuthSuccess />} />,
  <Route key="signup" path="/signup" element={<SignupPage />} />,
  <Route key="landing" path="/" element={<LandingPage />} />,
  <Route key="marking" path="/marking" element={<Marking />} />,
  <Route key="rankings" path="/rankings" element={<Rankings />} />,
];

export default routes;
