import React from "react";
import PropTypes from "prop-types";
import { Box, useTheme } from "@mui/system";

const BackgroundWrapper = ({ children }) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        display: "flex",
        flex: 1,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.palette.grey[900],
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
