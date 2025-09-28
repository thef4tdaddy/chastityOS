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

const logger = serviceLogger("SyncContext");

interface SyncContextType {
  isSyncing: boolean;
  lastSyncTime: Date | null;
  syncStatus: "synced" | "pending" | "conflict" | "error";
  pendingConflicts: ConflictInfo[];
  triggerSync: () => Promise<void>;
  hasConflicts: boolean;
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

export const SyncProvider: React.FC<SyncProviderProps> = ({ children }) => {
  const { data: user } = useAuth();
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

  // Determine sync status
  const getSyncStatus = (): SyncContextType["syncStatus"] => {
    if (error) return "error";
    if (pendingConflicts.length > 0) return "conflict";
    if (isSyncing) return "pending";
    return "synced";
  };

  // Auto-sync on user change and periodically
  useEffect(() => {
    if (!userId) return;

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
  }, [userId, sync]);

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

    try {
      await sync(userId, { force: true });
      setLastSyncTime(new Date());
    } catch (error) {
      logger.error("Manual sync failed", { error: error as Error });
      throw error;
    }
  };

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

  const contextValue: SyncContextType = {
    isSyncing,
    lastSyncTime,
    syncStatus: getSyncStatus(),
    pendingConflicts,
    triggerSync,
    hasConflicts: pendingConflicts.length > 0,
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
