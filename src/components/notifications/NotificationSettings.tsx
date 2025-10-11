/**
 * NotificationSettings Component
 * UI for managing notification preferences
 */
import React from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Switch,
  Button,
  Alert,
  Spinner,
} from "@/components/ui";
import { useNotificationSettings } from "@/hooks/useNotificationSettings";

interface NotificationSettingsProps {
  userId: string | null;
  isAuthReady: boolean;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  userId,
  isAuthReady,
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
        {/* Permission Status */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-nightly-spring-green">
            Push Notifications
          </h3>

          {permission === "denied" && (
            <Alert variant="error">
              <p>
                Push notifications are blocked. Please enable them in your
                browser settings to receive notifications.
              </p>
            </Alert>
          )}

          {permission === "default" && (
            <Alert variant="info">
              <p>
                Enable push notifications to receive alerts even when the app is
                not open.
              </p>
            </Alert>
          )}

          {permission === "granted" && (
            <Alert variant="success">
              <p>Push notifications are enabled.</p>
            </Alert>
          )}

          <div className="flex gap-3">
            {!isPermissionGranted && permission !== "denied" && (
              <Button
                variant="primary"
                onClick={handleRequestPermission}
                className="flex-1 sm:flex-initial"
              >
                Enable Notifications
              </Button>
            )}

            {isPermissionGranted && (
              <Button
                variant="secondary"
                onClick={sendTestNotification}
                className="flex-1 sm:flex-initial"
              >
                Test Notification
              </Button>
            )}
          </div>
        </div>

        {/* Notification Types */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-nightly-spring-green">
            Notification Types
          </h3>

          <div className="space-y-2">
            <Switch
              label="Session Notifications"
              description="Get notified about session starts, ends, and milestones"
              checked={settings.sessionNotifications}
              onCheckedChange={(checked) =>
                handleToggle("sessionNotifications", checked)
              }
            />

            <Switch
              label="Task Notifications"
              description="Get notified about new tasks, deadlines, and approvals"
              checked={settings.taskNotifications}
              onCheckedChange={(checked) =>
                handleToggle("taskNotifications", checked)
              }
            />

            <Switch
              label="Keyholder Notifications"
              description="Get notified about keyholder actions and messages"
              checked={settings.keyholderNotifications}
              onCheckedChange={(checked) =>
                handleToggle("keyholderNotifications", checked)
              }
            />

            <Switch
              label="System Notifications"
              description="Get notified about system updates and important announcements"
              checked={settings.systemNotifications}
              onCheckedChange={(checked) =>
                handleToggle("systemNotifications", checked)
              }
            />
          </div>
        </div>

        {/* Sound & Vibration */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-nightly-spring-green">
            Alerts
          </h3>

          <div className="space-y-2">
            <Switch
              label="Notification Sound"
              description="Play a sound when notifications arrive"
              checked={settings.soundEnabled}
              onCheckedChange={(checked) =>
                handleToggle("soundEnabled", checked)
              }
            />

            <Switch
              label="Vibration"
              description="Vibrate device when notifications arrive (mobile only)"
              checked={settings.vibrationEnabled}
              onCheckedChange={(checked) =>
                handleToggle("vibrationEnabled", checked)
              }
            />
          </div>
        </div>

        {/* Quiet Hours */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-nightly-spring-green">
            Quiet Hours
          </h3>

          <Switch
            label="Enable Quiet Hours"
            description="Pause notifications during specified hours"
            checked={settings.quietHours.enabled}
            onCheckedChange={(checked) =>
              updateSettings({
                quietHours: { ...settings.quietHours, enabled: checked },
              })
            }
          />

          {settings.quietHours.enabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pl-4 border-l-2 border-nightly-spring-green/30">
              <div>
                <label
                  htmlFor="quietStart"
                  className="block text-sm font-medium text-nightly-celadon mb-1"
                >
                  Start Time
                </label>
                <input
                  type="time"
                  id="quietStart"
                  value={settings.quietHours.startTime}
                  onChange={(e) =>
                    updateSettings({
                      quietHours: {
                        ...settings.quietHours,
                        startTime: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 bg-nightly-mobile-bg border border-nightly-celadon/30 rounded-md text-nightly-honeydew focus:outline-none focus:ring-2 focus:ring-nightly-spring-green"
                />
              </div>

              <div>
                <label
                  htmlFor="quietEnd"
                  className="block text-sm font-medium text-nightly-celadon mb-1"
                >
                  End Time
                </label>
                <input
                  type="time"
                  id="quietEnd"
                  value={settings.quietHours.endTime}
                  onChange={(e) =>
                    updateSettings({
                      quietHours: {
                        ...settings.quietHours,
                        endTime: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 bg-nightly-mobile-bg border border-nightly-celadon/30 rounded-md text-nightly-honeydew focus:outline-none focus:ring-2 focus:ring-nightly-spring-green"
                />
              </div>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};
