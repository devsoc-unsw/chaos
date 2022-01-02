import React, { Suspense, createContext, useState } from "react";
import { BrowserRouter, Routes } from "react-router-dom";
import { SnackbarProvider } from "notistack";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { NavBar, LoadingIndicator } from "./components";
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
    // success: {
    //   light: "#e2f3e2",
    // },
    // error: {
    //   light: "#FCDADA",
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

export const SetNavBarTitleContext = createContext(() => {});

const App = () => {
  const [AppBarTitle, setNavBarTitle] = useState("");

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3}>
        <Suspense fallback={<LoadingIndicator />}>
          <SetNavBarTitleContext.Provider value={setNavBarTitle}>
            <BrowserRouter>
              <header>
                <NavBar campaign={AppBarTitle} />
              </header>
              <Routes>{routes}</Routes>
            </BrowserRouter>
          </SetNavBarTitleContext.Provider>
        </Suspense>
      </SnackbarProvider>
    </ThemeProvider>
  );
};

export default App;
