import React, { Suspense, useState } from "react";
import { BrowserRouter, Routes } from "react-router-dom";
import { SnackbarProvider } from "notistack";
import { Box, CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { NavBar, LoadingIndicator } from "./components";
import { SetNavBarTitleContext } from "./contexts/SetNavbarTitleContext";
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

const App = () => {
  const [AppBarTitle, setNavBarTitle] = useState("");

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3}>
        <SetNavBarTitleContext.Provider value={setNavBarTitle}>
          <BrowserRouter>
            <NavBar campaign={AppBarTitle} />
            <Box pt={8} minHeight="100vh" display="flex">
              <Suspense fallback={<LoadingIndicator />}>
                <Routes>{routes}</Routes>
              </Suspense>
            </Box>
          </BrowserRouter>
        </SetNavBarTitleContext.Provider>
      </SnackbarProvider>
    </ThemeProvider>
  );
};

export default App;
