/**
 * useNotificationSettings Hook
 * Manages notification preferences and settings persistence
 */
import { useState, useEffect, useCallback } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/firebase";
import * as Sentry from "@sentry/react";
import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("useNotificationSettings");

export interface NotificationSettings {
  pushEnabled: boolean;
  sessionNotifications: boolean;
  taskNotifications: boolean;
  keyholderNotifications: boolean;
  systemNotifications: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
  };
  // Privacy & Safety Settings
  privacyMode: boolean; // Strip sensitive info from notifications
  emailNotifications: boolean; // Allow email notifications
  emailOptOut: boolean; // User has opted out of all emails
}

const defaultSettings: NotificationSettings = {
  pushEnabled: false,
  sessionNotifications: true,
  taskNotifications: true,
  keyholderNotifications: true,
  systemNotifications: true,
  soundEnabled: true,
  vibrationEnabled: true,
  quietHours: {
    enabled: false,
    startTime: "22:00",
    endTime: "08:00",
  },
  privacyMode: false,
  emailNotifications: true,
  emailOptOut: false,
};

export interface UseNotificationSettingsReturn {
  settings: NotificationSettings;
  isLoading: boolean;
  updateSettings: (updates: Partial<NotificationSettings>) => Promise<void>;
  requestPermission: () => Promise<"default" | "granted" | "denied">;
  permission: "default" | "granted" | "denied";
  isPermissionGranted: boolean;
  sendTestNotification: () => void;
}

export function useNotificationSettings(
  userId: string | null,
  isAuthReady: boolean,
): UseNotificationSettingsReturn {
  const [settings, setSettings] =
    useState<NotificationSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [permission, setPermission] = useState<
    "default" | "granted" | "denied"
  >(typeof Notification !== "undefined" ? Notification.permission : "default");

  // Load settings from Firestore
  useEffect(() => {
    if (!isAuthReady || !userId) {
      setIsLoading(false);
      return;
    }

    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const settingsDoc = doc(
          db,
          "users",
          userId,
          "settings",
          "notifications",
        );
        const docSnap = await getDoc(settingsDoc);

        if (docSnap.exists()) {
          const loadedSettings =
            docSnap.data() as Partial<NotificationSettings>;
          setSettings({ ...defaultSettings, ...loadedSettings });
          logger.info("Notification settings loaded", { userId });
        } else {
          // Initialize with defaults
          await setDoc(settingsDoc, defaultSettings);
          logger.info("Default notification settings created", { userId });
        }
      } catch (error) {
        logger.error("Failed to load notification settings", { error, userId });
        Sentry.captureException(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [userId, isAuthReady]);

  // Update settings
  const updateSettings = useCallback(
    async (updates: Partial<NotificationSettings>) => {
      if (!userId) {
        logger.warn("Cannot update settings: no userId");
        return;
      }

      try {
        const newSettings = { ...settings, ...updates };
        setSettings(newSettings);

        const settingsDoc = doc(
          db,
          "users",
          userId,
          "settings",
          "notifications",
        );
        await setDoc(settingsDoc, newSettings, { merge: true });

        logger.info("Notification settings updated", { userId, updates });
      } catch (error) {
        logger.error("Failed to update notification settings", {
          error,
          userId,
        });
        Sentry.captureException(error);
        throw error;
      }
    },
    [userId, settings],
  );

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<
    "default" | "granted" | "denied"
  > => {
    if (typeof Notification === "undefined") {
      logger.warn("Notifications not supported");
      return "denied";
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        await updateSettings({ pushEnabled: true });
        logger.info("Notification permission granted");
      } else {
        logger.info("Notification permission denied");
      }

      return result;
    } catch (error) {
      logger.error("Failed to request notification permission", { error });
      Sentry.captureException(error);
      return "denied";
    }
  }, [updateSettings]);

  // Send test notification
  const sendTestNotification = useCallback(() => {
    if (typeof Notification === "undefined" || permission !== "granted") {
      logger.warn("Cannot send test notification: permission not granted");
      return;
    }

    try {
      new Notification("ChastityOS Test Notification", {
        body: "If you can see this, notifications are working correctly!",
        icon: "/icon-192x192.png",
        badge: "/icon-192x192.png",
        tag: "test-notification",
      });
      logger.info("Test notification sent");
    } catch (error) {
      logger.error("Failed to send test notification", { error });
      Sentry.captureException(error);
    }
  }, [permission]);

  const isPermissionGranted = permission === "granted";

  return {
    settings,
    isLoading,
    updateSettings,
    requestPermission,
    permission,
    isPermissionGranted,
    sendTestNotification,
  };
}
