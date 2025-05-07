import { Box, CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { SnackbarProvider } from "notistack";
import { Suspense, useState } from "react";
import { Toaster } from "react-hot-toast";
import { BrowserRouter, Routes } from "react-router-dom";

import "twin.macro";
import "./index.css";
import { LoadingIndicator, NavBar } from "./components";
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
            <Box pt={8} minHeight="100vh" display="flex" tw="bg-gray-50">
              <Suspense fallback={<LoadingIndicator />}>
                <Routes>{routes}</Routes>
              </Suspense>
            </Box>
            <Toaster
              position="bottom-right"
              reverseOrder={false}
              toastOptions={{
                duration: 5000,
              }}
            />
          </BrowserRouter>
        </SetNavBarTitleContext.Provider>
      </SnackbarProvider>
    </ThemeProvider>
  );
};

export default App;
