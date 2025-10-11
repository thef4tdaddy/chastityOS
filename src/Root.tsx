import React, { Suspense } from "react";
import { Outlet } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import { FeedbackFAB } from "./components/feedback";
import NotificationContainer from "./components/ui/NotificationContainer";
import { PWAInstallPrompt } from "./components/system/PWAInstallPrompt";
import { PWAUpdateNotification } from "./components/system/PWAUpdateNotification";
import { NotificationPermissionPrompt } from "./components/notifications/NotificationPermissionPrompt";
import { useFCMInitialization } from "./hooks/useFCMInitialization";
import { useAuth } from "./contexts/AuthContext";

// Loading fallback component
const PageLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      <p className="mt-4 text-purple-300">Loading...</p>
    </div>
  </div>
);

const Root: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  // Initialize FCM and handle token management
  useFCMInitialization({
    userId: user?.uid || null,
    isAuthenticated,
  });

  return (
    <AppLayout>
      <Suspense fallback={<PageLoadingFallback />}>
        <Outlet />
      </Suspense>
      <FeedbackFAB />
      <NotificationContainer />
      <PWAInstallPrompt />
      <PWAUpdateNotification />
      <NotificationPermissionPrompt
        userId={user?.uid || null}
        showAfterDelay={30000}
      />
    </AppLayout>
  );
};

export default Root;
