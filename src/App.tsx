import React, { useEffect } from "react";
import { firebaseListeners } from "./services/sync";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "./hooks/api/queryClient";
import {
  AuthProvider,
  AppProvider,
} from "./contexts";
import Dashboard from "./pages/Dashboard";

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
          <Dashboard />
          <ReactQueryDevtools initialIsOpen={false} />
        </AuthProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;