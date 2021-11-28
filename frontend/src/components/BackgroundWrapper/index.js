import React from "react";
import PropTypes from "prop-types";
import { ThemeProvider, createTheme, Box } from "@mui/system";

const theme = createTheme({
  palette: {
    type: "dark",
    primary: {
      main: "#00bcd4",
    },
    secondary: {
      main: "#f50057",
    },
  },
});

const BackgroundWrapper = ({ children }) => (
  <ThemeProvider theme={theme}>
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        width: "100vw",
      }}
    >
      {children}
    </Box>
  </ThemeProvider>
);

BackgroundWrapper.propTypes = {
  children: PropTypes.node.isRequired,
};

export default BackgroundWrapper;
