import React, { Suspense } from "react";
import ReactDOM from "react-dom";
import { SnackbarProvider } from "notistack";
import { BrowserRouter as Router, Routes } from "react-router-dom";
import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import routes from "./routes";
import { LoadingIndicator } from "./components";
// import "./styles/global.css";

const theme = createTheme({
  palette: {
    primary: {
      main: "#3A76F8",
      dark: "#151719",
      // csesoc dark: "#40404C",
      light: "#ADC7FF",
    },
    secondary: {
      main: "#DBD2Ef",
      light: "#eceded",
    },
  },
  components: {
    MuiButton: {
      defaultProps: {
        variant: "contained",
        color: "primary",
      },
    },
  },
});

ReactDOM.render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <SnackbarProvider maxSnack={3}>
      <Suspense fallback={<LoadingIndicator />}>
        <Router>
          <Routes>{routes}</Routes>
        </Router>
      </Suspense>
    </SnackbarProvider>
  </ThemeProvider>,
  document.getElementById("root")
);
