/**
 * NotificationSettingsSection Component
 * Wrapper for NotificationSettings that integrates with auth context
 */
import React from "react";
import { useAuth } from "@/contexts";
import { NotificationSettings } from "@/components/notifications/NotificationSettings";

export const NotificationSettingsSection: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuth();

  return (
    <NotificationSettings
      userId={user?.uid || null}
      isAuthReady={!isAuthLoading}
    />
  );
};
