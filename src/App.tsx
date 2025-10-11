import React, { lazy, useEffect } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { firebaseListeners } from "./services/sync";
import { useBackgroundSync } from "./hooks/api/useBackgroundSync";
import { usePeriodicSync } from "./hooks/api/usePeriodicSync";

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

import Root from "./Root";

// Lazy load all pages for better code splitting
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ChastityTracking = lazy(() => import("./pages/ChastityTracking"));
const TasksPage = lazy(() => import("./pages/TasksPage"));
const LogEventPage = lazy(() => import("./pages/LogEventPage"));
const RewardsPunishmentsPage = lazy(
  () => import("./pages/RewardsPunishmentsPage"),
);
const RulesPage = lazy(() => import("./pages/RulesPage"));
const FullReportPage = lazy(() => import("./pages/FullReportPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const KeyholderPage = lazy(() => import("./pages/KeyholderPage"));
const KeyholderDemo = lazy(() => import("./pages/KeyholderDemo"));
const PublicProfilePage = lazy(() => import("./pages/PublicProfilePage"));
const RelationshipsPage = lazy(() => import("./pages/RelationshipsPage"));
const AchievementPage = lazy(() => import("./pages/AchievementPage"));
const ToastDemo = lazy(() => import("./demo/pages/ToastDemo"));
const ToggleGroupDemo = lazy(() => import("./demo/pages/ToggleGroupDemo"));

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
      {
        path: "/toggle-group-demo",
        element: (
          <RouteErrorBoundary routeName="toggle-group-demo">
            <ToggleGroupDemo />
          </RouteErrorBoundary>
        ),
      },
    ],
  },
]);

function App(): React.ReactElement {
  // Initialize background sync for offline queue
  const { registerBackgroundSync } = useBackgroundSync();

  // Initialize periodic sync
  const { settings: periodicSyncSettings, register: registerPeriodicSync } =
    usePeriodicSync();

  useEffect(() => {
    firebaseListeners.start();

    // Register background sync on app start
    registerBackgroundSync();

    // Register periodic sync if enabled in settings
    if (periodicSyncSettings.enabled) {
      registerPeriodicSync().catch(() => {
        // Error already logged by the hook
      });
    }

    return () => {
      firebaseListeners.stop();
    };
  }, [
    registerBackgroundSync,
    periodicSyncSettings.enabled,
    registerPeriodicSync,
  ]);

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
