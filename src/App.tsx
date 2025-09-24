import React, { useEffect } from "react";
import { firebaseListeners } from "./services/sync";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "./hooks/api/queryClient";
import {
  AuthProvider,
  AppProvider,
  useAuthState,
  useAppState,
} from "./contexts";

const AppContent: React.FC = () => {
  const authState = useAuthState();
  const appState = useAppState();

  return (
    <div>
      <h1>Welcome to the ChastityOS Rewrite</h1>
      <p>The application is being rebuilt on a new TypeScript foundation.</p>

      <div
        style={{
          marginTop: "20px",
          padding: "10px",
          background: "#f5f5f5",
          borderRadius: "8px",
        }}
      >
        <h3>System Status</h3>
        <p>
          Auth:{" "}
          {authState.isLoading
            ? "Loading..."
            : authState.isAuthenticated
              ? `Logged in as ${authState.user?.displayName}`
              : "Not logged in"}
        </p>
        <p>App: {appState.isInitialized ? "Initialized" : "Initializing..."}</p>
        <p>
          Connection: {appState.isOnline ? "Online" : "Offline"} (
          {appState.connectionType})
        </p>
        {appState.syncStatus && (
          <p>
            Last Sync: {appState.syncStatus.lastSyncTime.toLocaleTimeString()}
          </p>
        )}
      </div>

      {authState.error && (
        <div
          style={{
            marginTop: "10px",
            padding: "10px",
            background: "#ffebee",
            borderRadius: "8px",
            color: "#c62828",
          }}
        >
          Error: {authState.error}
        </div>
      )}
    </div>
  );
};

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
          <AppContent />
          <ReactQueryDevtools initialIsOpen={false} />
        </AuthProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;
