import React, { Suspense, createContext, useState } from "react";
import { BrowserRouter, Routes } from "react-router-dom";
import { SnackbarProvider } from "notistack";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { ChaosAppBar, LoadingIndicator } from "./components";
import routes from "./routes";

const theme = createTheme({
  palette: {
    primary: {
      main: "#3A76F8",
      dark: "#151719",
      // csesoc dark: "#40404C",
      light: "#ADC7FF",
    },
    // secondary: {
    //   main: "#DBD2Ef",
    //   light: "#eceded",
    // },
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

export const SetCampaignContext = createContext(() => {});

const App = () => {
  const [campaign, setCampaign] = useState("");

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3}>
        <Suspense fallback={<LoadingIndicator />}>
          <SetCampaignContext.Provider value={setCampaign}>
            <BrowserRouter>
              <header>
                <ChaosAppBar campaign={campaign} />
              </header>
              <Routes>{routes}</Routes>
            </BrowserRouter>
          </SetCampaignContext.Provider>
        </Suspense>
      </SnackbarProvider>
    </ThemeProvider>
  );
};

export default App;
