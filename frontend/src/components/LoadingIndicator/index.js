import React, { useState, useEffect } from "react";
import { LinearProgress, Typography } from "@mui/material";

const LoadingIndicator = () => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const timeout = setTimeout(() => setShow(true), 400);
    return () => {
      clearTimeout(timeout);
    };
  }, []);

  return (
    show && (
      <>
        <LinearProgress />
        <Typography>Loading...</Typography>
      </>
    )
  );
};

export default LoadingIndicator;
