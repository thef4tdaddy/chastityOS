/**
 * Dexie Sync Hook
 * Provides easy access to Dexie services with automatic sync management
 */
import { useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/AppContext";
import {
  sessionDBService,
  eventDBService,
  taskDBService,
  goalDBService,
  settingsDBService,
} from "@/services/database";
import { firebaseSync } from "@/services/sync";
import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("useDexieSync");

export const useDexieSync = () => {
  const { state: appState, actions: appActions } = useApp();
  const { user } = useAuth();

  /**
   * Get all Dexie services
   */
  const services = {
    sessions: sessionDBService,
    events: eventDBService,
    tasks: taskDBService,
    goals: goalDBService,
    settings: settingsDBService,
  };

  /**
   * Trigger manual sync
   */
  const triggerSync = useCallback(async () => {
    if (!user?.uid) {
      logger.warn("Cannot sync: no authenticated user");
      return;
    }

    try {
      await appActions.triggerSync(user.uid);
    } catch (error) {
      logger.error("Sync failed", { error: error as Error });
      throw error;
    }
  }, [user?.uid, appActions]);

  /**
   * Create a record with automatic sync queuing
   */
  const createWithSync = useCallback(
    async <T>(service: keyof typeof services, data: T): Promise<string> => {
      if (!user?.uid) {
        throw new Error("No authenticated user");
      }

      const id = await services[service].create(data as any);

      // Trigger background sync if online
      if (appState.isOnline) {
        try {
          await firebaseSync.sync();
        } catch (error) {
          logger.warn("Background sync failed", { error: error as Error });
          // Don't throw - local data is saved
        }
      }

      return id;
    },
    [user?.uid, appState.isOnline, services],
  );

  /**
   * Update a record with automatic sync queuing
   */
  const updateWithSync = useCallback(
    async <T>(
      service: keyof typeof services,
      id: string,
      updates: T,
    ): Promise<void> => {
      if (!user?.uid) {
        throw new Error("No authenticated user");
      }

      await services[service].update(id, updates as any);

      // Trigger background sync if online
      if (appState.isOnline) {
        try {
          await firebaseSync.sync();
        } catch (error) {
          logger.warn("Background sync failed", { error: error as Error });
          // Don't throw - local data is saved
        }
      }
    },
    [user?.uid, appState.isOnline, services],
  );

  /**
   * Delete a record with automatic sync queuing
   */
  const deleteWithSync = useCallback(
    async (service: keyof typeof services, id: string): Promise<void> => {
      if (!user?.uid) {
        throw new Error("No authenticated user");
      }

      await services[service].delete(id);

      // Trigger background sync if online
      if (appState.isOnline) {
        try {
          await firebaseSync.sync();
        } catch (error) {
          logger.warn("Background sync failed", { error: error as Error });
          // Don't throw - local data is saved
        }
      }
    },
    [user?.uid, appState.isOnline, services],
  );

  return {
    // Services
    services,

    // Sync control
    triggerSync,
    syncStatus: appState.syncStatus,
    lastSyncTime: appState.lastSyncTime,
    isOnline: appState.isOnline,

    // CRUD operations with sync
    createWithSync,
    updateWithSync,
    deleteWithSync,

    // Direct service access for read operations
    findById: useCallback(
      async (service: keyof typeof services, id: string) => {
        return services[service].findById(id);
      },
      [services],
    ),

    findByUserId: useCallback(
      async (service: keyof typeof services, userId: string) => {
        return services[service].findByUserId(userId);
      },
      [services],
    ),

    paginate: useCallback(
      async (
        service: keyof typeof services,
        userId: string,
        offset: number = 0,
        limit: number = 50,
      ) => {
        return services[service].paginate(userId, offset, limit);
      },
      [services],
    ),
  };
};
