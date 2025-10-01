/**
 * Application Context
 * Manages global app-level state (non-auth, non-UI)
 * Context layer - App state like connection status, sync status, etc.
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { firebaseSync } from "../services/sync";
import { preloadCriticalServices } from "../services/firebase";
import { achievementIntegration } from "../services/AchievementIntegration";
import { serviceLogger } from "../utils/logging";
import { db } from "../services/database";
import type { SyncStatus } from "../types/database";

// Extend Navigator interface for connection API
interface NavigatorWithConnection extends Navigator {
  connection?: {
    effectiveType: string;
    addEventListener: (event: string, callback: () => void) => void;
    removeEventListener: (event: string, callback: () => void) => void;
  };
}

const logger = serviceLogger("AppContext");

export interface AppState {
  isInitialized: boolean;
  isOnline: boolean;
  syncStatus: SyncStatus | null;
  lastSyncTime: Date | null;
  hasUnreadNotifications: boolean;
  connectionType: string | null;
  sessionPersistenceReady: boolean;
}

export interface AppActions {
  initializeApp: () => Promise<void>;
  triggerSync: (userId: string) => Promise<void>;
  markNotificationsRead: () => void;
  updateConnectionStatus: (isOnline: boolean) => void;
}

export interface AppContextType {
  state: AppState;
  actions: AppActions;
}

const AppContext = createContext<AppContextType | null>(null);

interface AppProviderProps {
  children: ReactNode;
}

// Helper function for app initialization
const performAppInitialization = async (
  setState: React.Dispatch<React.SetStateAction<AppState>>,
): Promise<void> => {
  try {
    logger.info("Initializing application");

    await db.initialize();
    logger.info("Dexie database initialized");

    await preloadCriticalServices();
    await achievementIntegration.initialize();

    logger.info("Session persistence service ready");
    setState((prev) => ({ ...prev, sessionPersistenceReady: true }));

    const syncStatus = "synced" as SyncStatus;
    const connection = (navigator as NavigatorWithConnection).connection;
    const connectionType = connection?.effectiveType || "unknown";

    setState((prev) => ({
      ...prev,
      isInitialized: true,
      syncStatus,
      connectionType,
    }));

    logger.info("Application initialized successfully", { connectionType });
  } catch (error) {
    logger.error("Failed to initialize application", {
      error: error as Error,
    });
    setState((prev) => ({
      ...prev,
      isInitialized: false,
    }));
  }
};

// Helper hook for connection event listeners
const useConnectionListeners = (
  setState: React.Dispatch<React.SetStateAction<AppState>>,
) => {
  useEffect(() => {
    const handleOnline = () => {
      setState((prev) => ({ ...prev, isOnline: true }));
      logger.debug("App went online");
    };

    const handleOffline = () => {
      setState((prev) => ({ ...prev, isOnline: false }));
      logger.debug("App went offline");
    };

    const handleConnectionChange = () => {
      const connection = (navigator as NavigatorWithConnection).connection;
      if (connection) {
        setState((prev) => ({
          ...prev,
          connectionType: connection.effectiveType || "unknown",
        }));
        logger.debug("Connection type changed", {
          type: connection.effectiveType,
        });
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if ("connection" in navigator) {
      (navigator as NavigatorWithConnection).connection?.addEventListener(
        "change",
        handleConnectionChange,
      );
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);

      if ("connection" in navigator) {
        (navigator as NavigatorWithConnection).connection?.removeEventListener(
          "change",
          handleConnectionChange,
        );
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // setState is stable, no need to include in deps
};

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, setState] = useState<AppState>({
    isInitialized: false,
    isOnline: navigator.onLine,
    syncStatus: null,
    lastSyncTime: null,
    hasUnreadNotifications: false,
    connectionType: null,
    sessionPersistenceReady: false,
  });

  // Initialize app on mount
  useEffect(() => {
    performAppInitialization(setState);
  }, []);

  // Setup connection listeners
  useConnectionListeners(setState);

  const actions: AppActions = {
    initializeApp: async () => {
      if (state.isInitialized) {
        logger.debug("App already initialized, skipping");
        return;
      }

      setState((prev) => ({ ...prev, isInitialized: false }));

      try {
        // Initialize Dexie database first
        await db.initialize();
        logger.info("Dexie database re-initialized");

        await preloadCriticalServices();
        // FirebaseSync initializes automatically

        const syncStatus = "synced" as SyncStatus;

        setState((prev) => ({
          ...prev,
          isInitialized: true,
          syncStatus,
        }));

        logger.info("App re-initialized successfully");
      } catch (error) {
        logger.error("Failed to re-initialize app", { error: error as Error });
      }
    },

    triggerSync: async (userId: string) => {
      logger.debug("Triggering manual sync", { userId });

      try {
        await firebaseSync.sync();
        const result = {
          success: true,
          data: {
            syncStatus: "synced" as SyncStatus,
            lastSyncTime: new Date(),
          },
        };

        if (result.success && result.data) {
          setState((prev) => ({
            ...prev,
            syncStatus: result.data.syncStatus,
            lastSyncTime: result.data.lastSyncTime,
          }));
          logger.info("Manual sync completed", { userId });
        }
      } catch (error) {
        const result = {
          success: false,
          error: error instanceof Error ? error.message : "Sync failed",
        };
        logger.warn("Manual sync failed", { userId, error: result.error });
      }
    },

    markNotificationsRead: () => {
      setState((prev) => ({
        ...prev,
        hasUnreadNotifications: false,
      }));
      logger.debug("Notifications marked as read");
    },

    updateConnectionStatus: (isOnline: boolean) => {
      setState((prev) => ({
        ...prev,
        isOnline,
      }));
      logger.debug("Connection status updated", { isOnline });
    },
  };

  const contextValue: AppContextType = {
    state,
    actions,
  };

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};

// Convenience hooks for common use cases
export const useAppState = () => {
  const { state } = useApp();
  return state;
};

export const useAppActions = () => {
  const { actions } = useApp();
  return actions;
};

export const useConnectionStatus = () => {
  const { state } = useApp();
  return {
    isOnline: state.isOnline,
    connectionType: state.connectionType,
  };
};

export const useSyncStatus = () => {
  const { state, actions } = useApp();
  return {
    syncStatus: state.syncStatus,
    lastSyncTime: state.lastSyncTime,
    triggerSync: actions.triggerSync,
  };
};
