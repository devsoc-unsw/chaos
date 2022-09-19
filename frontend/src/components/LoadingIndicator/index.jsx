import React, { useState, useEffect } from "react";
import { LinearProgress } from "@mui/material";
import "twin.macro";

const LoadingIndicator = () => (
  <div tw="flex flex-col flex-1">
    <LinearProgress />
    <div tw="flex-1 flex items-center justify-center">Loading...</div>
  </div>
);

export default LoadingIndicator;
