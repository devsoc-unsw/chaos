import React, { lazy } from "react";
import { Route } from "react-router-dom";

const LandingPage = lazy(() => import("./pages/landing"));
const HomePage = lazy(() => import("./pages/home"));
const AuthSuccess = lazy(() => import("./pages/auth_success"));
const SignupPage = lazy(() => import("./pages/signup"));

const routes = [
  <Route key="dashboard" path="/dashboard" element={<HomePage />} />,
  <Route key="auth" path="/auth/callback" element={<AuthSuccess />} />,
  <Route key="signup" path="/signup" element={<SignupPage />} />,
  <Route key="landing" path="/" element={<LandingPage />} />,
];

export default routes;
