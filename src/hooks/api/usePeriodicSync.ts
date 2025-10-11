/**
 * Periodic Sync Hook
 * Provides interface for managing periodic background sync
 */
import { useState, useEffect, useCallback } from "react";
import {
  periodicSyncService,
  PeriodicSyncSettings,
} from "@/services/sync/PeriodicSyncService";
import { serviceLogger } from "@/utils/logging";
import { useAuthState } from "@/contexts";

const logger = serviceLogger("usePeriodicSync");

export function usePeriodicSync() {
  const { user } = useAuthState();
  const [settings, setSettings] = useState<PeriodicSyncSettings>(
    periodicSyncService.getSettings(),
  );
  const [isSupported, setIsSupported] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | undefined>(
    periodicSyncService.getLastSyncTime(),
  );

  // Check support on mount
  useEffect(() => {
    setIsSupported(periodicSyncService.isSupported());
  }, []);

  // Update settings
  const updateSettings = useCallback(
    async (newSettings: Partial<PeriodicSyncSettings>) => {
      try {
        await periodicSyncService.updateSettings(newSettings);
        setSettings(periodicSyncService.getSettings());
        logger.info("Periodic sync settings updated");
      } catch (error) {
        logger.error("Failed to update periodic sync settings", error);
        throw error;
      }
    },
    [],
  );

  // Register periodic sync
  const register = useCallback(async () => {
    try {
      await periodicSyncService.register();
      setSettings(periodicSyncService.getSettings());
      logger.info("Periodic sync registered");
    } catch (error) {
      logger.error("Failed to register periodic sync", error);
      throw error;
    }
  }, []);

  // Unregister periodic sync
  const unregister = useCallback(async () => {
    try {
      await periodicSyncService.unregister();
      setSettings(periodicSyncService.getSettings());
      logger.info("Periodic sync unregistered");
    } catch (error) {
      logger.error("Failed to unregister periodic sync", error);
      throw error;
    }
  }, []);

  // Listen for periodic sync messages from service worker
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    const handleMessage = async (event: MessageEvent) => {
      const { data } = event;

      if (data?.type === "PERIODIC_SYNC" && data?.action === "REFRESH_DATA") {
        logger.info("Received periodic sync request from service worker");

        try {
          // Refresh data using the service
          await periodicSyncService.refreshAppData(user?.uid || null);
          setLastSyncTime(Date.now());
          logger.info("Periodic sync completed");
        } catch (error) {
          logger.error("Failed to process periodic sync", error);
        }
      }
    };

    navigator.serviceWorker.addEventListener("message", handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener("message", handleMessage);
    };
  }, [user?.uid]);

  return {
    settings,
    isSupported,
    lastSyncTime,
    updateSettings,
    register,
    unregister,
  };
}
