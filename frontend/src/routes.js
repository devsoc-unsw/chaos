import React, { lazy } from "react";
import { Route } from "react-router-dom";
// import { PrivateRoute } from "./components";

// const LandingPage = lazy(() => import("./pages/landing"));
import LandingPage from "./pages/landing";

const routes = [<Route key="landing" path="/" element={<LandingPage />} />];

export default routes;
