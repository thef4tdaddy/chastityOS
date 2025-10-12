/**
 * Sync Context
 * Provides sync state and conflict resolution across the app
 */
import React, { createContext, useContext, useState, useEffect } from "react";
import { useSync } from "@/hooks/useSync";
import { useAuth } from "@/hooks/api/useAuth";
import { ConflictResolutionModal } from "@/components/common/ConflictResolutionModal";
import type { ConflictInfo } from "@/types/database";
import { serviceLogger } from "@/utils/logging";
import { canUseCloudSync } from "@/utils/auth/google-auth-check";

const logger = serviceLogger("SyncContext");

interface SyncContextType {
  isSyncing: boolean;
  lastSyncTime: Date | null;
  syncStatus: "synced" | "pending" | "conflict" | "error" | "disabled";
  pendingConflicts: ConflictInfo[];
  triggerSync: () => Promise<void>;
  hasConflicts: boolean;
  canSync: boolean; // True if user has Google sign-in
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const useSyncContext = (): SyncContextType => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error("useSyncContext must be used within SyncProvider");
  }
  return context;
};

interface SyncProviderProps {
  children: React.ReactNode;
}

// Helper function to determine sync status
const getSyncStatus = (
  error: Error | null,
  pendingConflicts: ConflictInfo[],
  isSyncing: boolean,
  canSync: boolean,
): SyncContextType["syncStatus"] => {
  if (!canSync) return "disabled";
  if (error) return "error";
  if (pendingConflicts.length > 0) return "conflict";
  if (isSyncing) return "pending";
  return "synced";
};

// Helper hook for conflict resolution handlers
const useConflictResolutionHandlers = (
  resolveConflicts: (
    resolutions: Record<string, "local" | "remote">,
  ) => Promise<void>,
  setShowConflictModal: (show: boolean) => void,
  sync: (userId: string, options?: any) => Promise<any>,
  setLastSyncTime: (time: Date | null) => void,
  userId: string | undefined,
) => {
  const handleResolveConflicts = async (
    resolutions: Record<string, "local" | "remote">,
  ) => {
    try {
      await resolveConflicts(resolutions);
      setShowConflictModal(false);

      // Trigger a sync after resolving conflicts
      if (userId) {
        await sync(userId);
        setLastSyncTime(new Date());
      }
    } catch (error) {
      logger.error("Failed to resolve conflicts", { error: error as Error });
    }
  };

  const handleCancelConflictResolution = () => {
    setShowConflictModal(false);
    // Conflicts remain pending - user can resolve them later
  };

  return { handleResolveConflicts, handleCancelConflictResolution };
};

export const SyncProvider: React.FC<SyncProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.uid;
  const {
    isSyncing,
    lastSyncResult: _lastSyncResult,
    pendingConflicts,
    sync,
    resolveConflicts,
    error,
  } = useSync();

  const [showConflictModal, setShowConflictModal] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [canSync, setCanSync] = useState(false);

  // Check if user can sync (requires Google sign-in)
  useEffect(() => {
    const checkSyncCapability = async () => {
      const canSyncCloud = await canUseCloudSync();
      setCanSync(canSyncCloud);

      if (!canSyncCloud && userId) {
        logger.info("Cloud sync disabled - Google sign-in required", {
          userId,
        });
      }
    };

    checkSyncCapability();
  }, [userId, user]);

  // Auto-sync on user change and periodically (only if user can sync)
  useEffect(() => {
    if (!userId || !canSync) return;

    const performSync = async () => {
      try {
        await sync(userId, { conflictResolution: "auto" });
        setLastSyncTime(new Date());
      } catch (error) {
        logger.error("Auto-sync failed", { error: error as Error });
      }
    };

    // Initial sync
    performSync();

    // Periodic sync every 5 minutes
    const interval = setInterval(performSync, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [userId, sync, canSync]);

  // Show conflict modal when conflicts are detected
  useEffect(() => {
    if (pendingConflicts.length > 0 && !showConflictModal) {
      setShowConflictModal(true);
    }
  }, [pendingConflicts.length, showConflictModal]);

  const triggerSync = async (): Promise<void> => {
    if (!userId) {
      throw new Error("No user authenticated");
    }

    if (!canSync) {
      throw new Error(
        "Cloud sync requires Google sign-in. Sign in with Google to enable cross-device synchronization.",
      );
    }

    try {
      await sync(userId, { force: true });
      setLastSyncTime(new Date());
    } catch (error) {
      logger.error("Manual sync failed", { error: error as Error });
      throw error;
    }
  };

  const { handleResolveConflicts, handleCancelConflictResolution } =
    useConflictResolutionHandlers(
      resolveConflicts,
      setShowConflictModal,
      async (userId: string) => {
        await sync(userId);
      },
      setLastSyncTime,
      userId,
    );

  const contextValue: SyncContextType = {
    isSyncing,
    lastSyncTime,
    syncStatus: getSyncStatus(error, pendingConflicts, isSyncing, canSync),
    pendingConflicts,
    triggerSync,
    hasConflicts: pendingConflicts.length > 0,
    canSync,
  };

  return (
    <SyncContext.Provider value={contextValue}>
      {children}

      <ConflictResolutionModal
        conflicts={pendingConflicts}
        onResolve={handleResolveConflicts}
        onCancel={handleCancelConflictResolution}
        isOpen={showConflictModal}
      />
    </SyncContext.Provider>
  );
};
