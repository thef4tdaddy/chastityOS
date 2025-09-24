import React, { useEffect } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { firebaseListeners } from "./services/sync";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "./hooks/api/queryClient";
import { AuthProvider, AppProvider } from "./contexts";
import Dashboard from "./pages/Dashboard";
import ChastityTracking from "./pages/ChastityTracking";
import Root from "./Root";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      {
        path: "/",
        element: <Dashboard />,
      },
      {
        path: "/chastity-tracking",
        element: <ChastityTracking />,
      },
    ],
  },
]);

function App(): React.ReactElement {
  useEffect(() => {
    firebaseListeners.start();
    return () => {
      firebaseListeners.stop();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <AuthProvider>
          <RouterProvider router={router} />
          <ReactQueryDevtools initialIsOpen={false} />
        </AuthProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;
