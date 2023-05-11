import { Box, CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { SnackbarProvider } from "notistack";
import { Suspense, useCallback, useRef, useState } from "react";
import { BrowserRouter, Routes } from "react-router-dom";
import "twin.macro";

import { MessagePopupContext } from "contexts/MessagePopupContext";

import { LoadingIndicator, MessagePopup, NavBar } from "./components";
import { SetNavBarTitleContext } from "./contexts/SetNavbarTitleContext";
import routes from "./routes";

import type { Message } from "contexts/MessagePopupContext";

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
  const nextMessageId = useRef(1);

  const pushMessage = useCallback(
    (message: Omit<Message, "id">) => {
      setMessagePopup([
        ...messagePopup,
        // eslint-disable-next-line no-plusplus
        { ...message, id: nextMessageId.current++ },
      ]);

      setTimeout(() => {
        setMessagePopup(messagePopup.slice(1));
      }, 5000);
    },
    [setMessagePopup, messagePopup]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3}>
        <MessagePopupContext.Provider value={pushMessage}>
          <SetNavBarTitleContext.Provider value={setNavBarTitle}>
            <BrowserRouter>
              <NavBar campaign={AppBarTitle} />
              <Box pt={8} minHeight="100vh" display="flex" tw="bg-gray-50">
                <Suspense fallback={<LoadingIndicator />}>
                  <Routes>{routes}</Routes>
                </Suspense>
              </Box>
              <div tw="fixed right-4 bottom-4 space-y-3">
                {messagePopup.map((message) => (
                  <MessagePopup key={message.id} type={message.type}>
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
