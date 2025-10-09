import React, { lazy, useEffect } from "react";
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
      {
        path: "/tasks",
        element: <TasksPage />,
      },
      {
        path: "/log-event",
        element: <LogEventPage />,
      },
      {
        path: "/rewards-punishments",
        element: <RewardsPunishmentsPage />,
      },
      {
        path: "/rules",
        element: <RulesPage />,
      },
      {
        path: "/full-report",
        element: <FullReportPage />,
      },
      {
        path: "/settings",
        element: <SettingsPage />,
      },
      {
        path: "/keyholder",
        element: <KeyholderPage />,
      },
      {
        path: "/keyholder-demo",
        element: <KeyholderDemo />,
      },
      {
        path: "/achievements",
        element: <AchievementPage />,
      },
      {
        path: "/public-profile/:userId",
        element: <PublicProfilePage />,
      },
      {
        path: "/relationships",
        element: <RelationshipsPage />,
      },
      {
        path: "/toast-demo",
        element: <ToastDemo />,
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
