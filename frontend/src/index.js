import React, { Suspense } from "react";
import ReactDOM from "react-dom";
import { SnackbarProvider } from "notistack";
import { BrowserRouter as Router, Routes } from "react-router-dom";
import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import routes from "./routes";
// import "./styles/global.css";

const theme = createTheme({
  palette: {
    primary: {
      main: "#00bcd4",
    },
    secondary: {
      main: "#ff4081",
    },
  },
  props: {
    MuiButton: {
      variant: "contained",
      color: "primary",
    },
  },
});

ReactDOM.render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <SnackbarProvider maxSnack={3}>
      <Router>
        <Routes>{routes}</Routes>
      </Router>
    </SnackbarProvider>
  </ThemeProvider>,
  document.getElementById("root")
);
