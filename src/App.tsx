import React, { useEffect } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { firebaseListeners } from "./services/sync";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "./hooks/api/queryClient";
import {
  AuthProvider,
  AppProvider,
  ToastProvider,
  SyncProvider,
} from "./contexts";

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
import ToastDemo from "./pages/showcase/ToastDemo";
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
