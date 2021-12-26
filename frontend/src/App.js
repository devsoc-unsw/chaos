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

export const SetAppBarTitleContext = createContext(() => {});

const App = () => {
  const [AppBarTitle, setAppBarTitle] = useState("");

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3}>
        <Suspense fallback={<LoadingIndicator />}>
          <SetAppBarTitleContext.Provider value={setAppBarTitle}>
            <BrowserRouter>
              <header>
                <ChaosAppBar campaign={AppBarTitle} />
              </header>
              <Routes>{routes}</Routes>
            </BrowserRouter>
          </SetAppBarTitleContext.Provider>
        </Suspense>
      </SnackbarProvider>
    </ThemeProvider>
  );
};

export default App;
