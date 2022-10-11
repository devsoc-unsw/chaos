import { Box, CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { SnackbarProvider } from "notistack";
import { Suspense, useCallback, useState } from "react";
import { BrowserRouter, Routes } from "react-router-dom";

import { MessagePopupContext } from "contexts/MessagePopupContext";

import { LoadingIndicator, MessagePopup, NavBar } from "./components";
import { SetNavBarTitleContext } from "./contexts/SetNavbarTitleContext";
import routes from "./routes";

import type { Message } from "contexts/MessagePopupContext";

import "twin.macro";

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
  const [messagePopup, setMessagePopup] = useState<Message[]>([]);

  const pushMessage = useCallback(
    (message: Message) => {
      setMessagePopup([...messagePopup, message]);
      setTimeout(() => {
        setMessagePopup(messagePopup.slice(1));
      }, 5000);
    },
    [setMessagePopup]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3}>
        <MessagePopupContext.Provider value={pushMessage}>
          <SetNavBarTitleContext.Provider value={setNavBarTitle}>
            <BrowserRouter>
              <NavBar campaign={AppBarTitle} />
              <Box pt={8} minHeight="100vh" display="flex">
                <Suspense fallback={<LoadingIndicator />}>
                  <Routes>{routes}</Routes>
                </Suspense>
              </Box>
              <div tw="fixed right-4 bottom-4 space-y-2">
                {messagePopup.map((message) => (
                  <MessagePopup type={message.type}>
                    {message.message}
                  </MessagePopup>
                ))}
              </div>
            </BrowserRouter>
          </SetNavBarTitleContext.Provider>
        </MessagePopupContext.Provider>
      </SnackbarProvider>
    </ThemeProvider>
  );
};

export default App;
