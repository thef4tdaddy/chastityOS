import React, { useEffect } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { firebaseListeners } from "./services/sync";
import { useBackgroundSync } from "./hooks/api/useBackgroundSync";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "./hooks/api/queryClient";
import {
  AuthProvider,
  AppProvider,
  ToastProvider,
  SyncProvider,
} from "./contexts";

// Error Boundaries
import { RouteErrorBoundary } from "./components/errors";

// Pages
import Dashboard from "./pages/Dashboard";
import ChastityTracking from "./pages/ChastityTracking";
import TasksPage from "./pages/TasksPage";
import LogEventPage from "./pages/LogEventPage";
import RewardsPunishmentsPage from "./pages/RewardsPunishmentsPage";
import RulesPage from "./pages/RulesPage";
import FullReportPage from "./pages/FullReportPage";
import SettingsPage from "./pages/SettingsPage";
import KeyholderPage from "./pages/KeyholderPage";
import KeyholderDemo from "./pages/KeyholderDemo";
import PublicProfilePage from "./pages/PublicProfilePage";
import RelationshipsPage from "./pages/RelationshipsPage";
import AchievementPage from "./pages/AchievementPage";
import ToastDemo from "./demo/pages/ToastDemo";
import Root from "./Root";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      {
        path: "/",
        element: (
          <RouteErrorBoundary routeName="dashboard">
            <Dashboard />
          </RouteErrorBoundary>
        ),
      },
      {
        path: "/chastity-tracking",
        element: (
          <RouteErrorBoundary routeName="chastity-tracking">
            <ChastityTracking />
          </RouteErrorBoundary>
        ),
      },
      {
        path: "/tasks",
        element: (
          <RouteErrorBoundary routeName="tasks">
            <TasksPage />
          </RouteErrorBoundary>
        ),
      },
      {
        path: "/log-event",
        element: (
          <RouteErrorBoundary routeName="log-event">
            <LogEventPage />
          </RouteErrorBoundary>
        ),
      },
      {
        path: "/rewards-punishments",
        element: (
          <RouteErrorBoundary routeName="rewards-punishments">
            <RewardsPunishmentsPage />
          </RouteErrorBoundary>
        ),
      },
      {
        path: "/rules",
        element: (
          <RouteErrorBoundary routeName="rules">
            <RulesPage />
          </RouteErrorBoundary>
        ),
      },
      {
        path: "/full-report",
        element: (
          <RouteErrorBoundary routeName="full-report">
            <FullReportPage />
          </RouteErrorBoundary>
        ),
      },
      {
        path: "/settings",
        element: (
          <RouteErrorBoundary routeName="settings">
            <SettingsPage />
          </RouteErrorBoundary>
        ),
      },
      {
        path: "/keyholder",
        element: (
          <RouteErrorBoundary routeName="keyholder">
            <KeyholderPage />
          </RouteErrorBoundary>
        ),
      },
      {
        path: "/keyholder-demo",
        element: (
          <RouteErrorBoundary routeName="keyholder-demo">
            <KeyholderDemo />
          </RouteErrorBoundary>
        ),
      },
      {
        path: "/achievements",
        element: (
          <RouteErrorBoundary routeName="achievements">
            <AchievementPage />
          </RouteErrorBoundary>
        ),
      },
      {
        path: "/public-profile/:userId",
        element: (
          <RouteErrorBoundary routeName="public-profile">
            <PublicProfilePage />
          </RouteErrorBoundary>
        ),
      },
      {
        path: "/relationships",
        element: (
          <RouteErrorBoundary routeName="relationships">
            <RelationshipsPage />
          </RouteErrorBoundary>
        ),
      },
      {
        path: "/toast-demo",
        element: (
          <RouteErrorBoundary routeName="toast-demo">
            <ToastDemo />
          </RouteErrorBoundary>
        ),
      },
    ],
  },
]);

function App(): React.ReactElement {
  // Initialize background sync for offline queue
  const { registerBackgroundSync } = useBackgroundSync();

  useEffect(() => {
    firebaseListeners.start();

    // Register background sync on app start
    registerBackgroundSync();

    return () => {
      firebaseListeners.stop();
    };
  }, [registerBackgroundSync]);

  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <AuthProvider>
          <SyncProvider>
            <ToastProvider>
              <RouterProvider router={router} />
              <ReactQueryDevtools initialIsOpen={false} />
            </ToastProvider>
          </SyncProvider>
        </AuthProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;
