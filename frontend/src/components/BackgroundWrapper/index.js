import React from "react";
import PropTypes from "prop-types";
import { Box, useTheme } from "@mui/system";

const BackgroundWrapper = ({ children }) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        minWidth: "100vw",
        backgroundColor: theme.palette.primary.main,
      }}
    >
      {children}
    </Box>
  );
};

BackgroundWrapper.propTypes = {
  children: PropTypes.node.isRequired,
};

export default BackgroundWrapper;
