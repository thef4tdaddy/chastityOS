/**
 * NotificationSettings Component
 * UI for managing notification preferences
 */
import React from "react";
import { Card, CardHeader, CardBody, Spinner } from "@/components/ui";
import { useNotificationSettings } from "@/hooks/useNotificationSettings";
import {
  PermissionStatusSection,
  NotificationTypeSection,
  SoundVibrationSection,
  QuietHoursSection,
  PrivacySafetySection,
} from "./NotificationSettingsSections";

interface NotificationSettingsProps {
  userId: string | null;
  isAuthReady: boolean;
  isAnonymous?: boolean;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  userId,
  isAuthReady,
  isAnonymous = false,
}) => {
  const {
    settings,
    isLoading,
    updateSettings,
    requestPermission,
    permission,
    isPermissionGranted,
    sendTestNotification,
  } = useNotificationSettings(userId, isAuthReady);

  const handleToggle = async (key: keyof typeof settings, value: boolean) => {
    await updateSettings({ [key]: value });
  };

  const handleRequestPermission = async () => {
    await requestPermission();
  };

  if (isLoading) {
    return (
      <Card>
        <CardBody>
          <div className="flex justify-center items-center py-8">
            <Spinner size="lg" />
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-2xl font-bold text-nightly-honeydew">
          Notification Settings
        </h2>
        <p className="text-nightly-celadon">
          Manage your notification preferences and permissions.
        </p>
      </CardHeader>

      <CardBody className="space-y-6">
        <PermissionStatusSection
          permission={permission}
          isPermissionGranted={isPermissionGranted}
          onRequestPermission={handleRequestPermission}
          onTestNotification={sendTestNotification}
        />

        <NotificationTypeSection settings={settings} onToggle={handleToggle} />

        <SoundVibrationSection settings={settings} onToggle={handleToggle} />

        <QuietHoursSection
          settings={settings}
          onUpdateSettings={updateSettings}
        />

        <PrivacySafetySection
          settings={settings}
          onToggle={handleToggle}
          isAnonymous={isAnonymous}
        />
      </CardBody>
    </Card>
  );
};
