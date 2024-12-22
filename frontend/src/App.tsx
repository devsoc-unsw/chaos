import { SnackbarProvider } from "notistack";
import { Suspense, useState } from "react";
import { Toaster } from "react-hot-toast";
import { BrowserRouter, Routes } from "react-router-dom";
import "twin.macro";

import { LoadingIndicator, NavBar } from "./components";
import { SetNavBarTitleContext } from "./contexts/SetNavbarTitleContext";
import routes from "./routes";

const App = () => {
  const [AppBarTitle, setNavBarTitle] = useState("");

  return (
    <SnackbarProvider maxSnack={3}>
      <SetNavBarTitleContext.Provider value={setNavBarTitle}>
        <BrowserRouter>
          <NavBar campaign={AppBarTitle} />
          <div tw="flex min-h-screen bg-gray-50 pt-16">
            <Suspense fallback={<LoadingIndicator />}>
              <Routes>{routes}</Routes>
            </Suspense>
          </div>
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
  );
};

export default App;
