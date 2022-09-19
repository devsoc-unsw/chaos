import React, { useState, useEffect } from "react";
import { LinearProgress, Typography } from "@mui/material";

const LoadingIndicator = () => (
  <>
    <LinearProgress />
    <Typography>Loading...</Typography>
  </>
);

export default LoadingIndicator;
