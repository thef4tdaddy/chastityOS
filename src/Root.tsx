import React from "react";
import { Outlet } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import { FeedbackFAB } from "./components/feedback";
import NotificationContainer from "./components/ui/NotificationContainer";
import { PWAInstallPrompt } from "./components/system/PWAInstallPrompt";
import { PWAUpdateNotification } from "./components/system/PWAUpdateNotification";

const Root: React.FC = () => {
  return (
    <AppLayout>
      <Outlet />
      <FeedbackFAB />
      <NotificationContainer />
      <PWAInstallPrompt />
      <PWAUpdateNotification />
    </AppLayout>
  );
};

export default Root;
