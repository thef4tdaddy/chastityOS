/**
 * useSync Hook
 * Manages synchronization state and conflict resolution
 */
import { useState, useEffect, useCallback } from "react";
import { firebaseSync } from "@/services/sync";
import type { SyncResult, ConflictInfo, SyncOptions } from "@/types/database";
import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("useSync");

interface UseSyncState {
  isSyncing: boolean;
  lastSyncResult: SyncResult | null;
  pendingConflicts: ConflictInfo[];
  error: Error | null;
}

interface UseSyncActions {
  sync: (userId: string, options?: SyncOptions) => Promise<SyncResult>;
  resolveConflicts: (resolutions: Record<string, "local" | "remote">) => Promise<void>;
  clearError: () => void;
}

export const useSync = (): UseSyncState & UseSyncActions => {
  const [state, setState] = useState<UseSyncState>({
    isSyncing: false,
    lastSyncResult: null,
    pendingConflicts: [],
    error: null,
  });

  // Check for pending conflicts on mount
  useEffect(() => {
    const checkPendingConflicts = () => {
      const conflicts = firebaseSync.getPendingConflicts();
      setState(prev => ({ ...prev, pendingConflicts: conflicts }));
    };

    checkPendingConflicts();
    
    // Check periodically for conflicts
    const interval = setInterval(checkPendingConflicts, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const sync = useCallback(async (userId: string, options?: SyncOptions): Promise<SyncResult> => {
    setState(prev => ({ ...prev, isSyncing: true, error: null }));
    
    try {
      logger.info("Starting sync", { userId, options });
      const result = await firebaseSync.syncUserData(userId, options);
      
      setState(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncResult: result,
        pendingConflicts: result.conflicts.length > 0 ? result.conflicts : prev.pendingConflicts,
      }));
      
      logger.info("Sync completed", { 
        success: result.success, 
        conflicts: result.conflicts.length 
      });
      
      return result;
    } catch (error) {
      const err = error as Error;
      logger.error("Sync failed", { error: err });
      
      setState(prev => ({
        ...prev,
        isSyncing: false,
        error: err,
      }));
      
      throw error;
    }
  }, []);

  const resolveConflicts = useCallback(async (resolutions: Record<string, "local" | "remote">): Promise<void> => {
    try {
      logger.info("Resolving conflicts", { resolutionCount: Object.keys(resolutions).length });
      
      // Apply resolutions (implementation would depend on specific conflict resolution logic)
      const resolvedIds: string[] = [];
      
      for (const [conflictKey, resolution] of Object.entries(resolutions)) {
        // conflictKey format: "collection-documentId-index" or similar
        const conflict = state.pendingConflicts.find(c => 
          `${c.collection}-${c.documentId}` === conflictKey.split('-').slice(0, 2).join('-')
        );
        
        if (conflict) {
          // Apply the chosen resolution
          const dataToApply = resolution === "local" ? conflict.localData : conflict.remoteData;
          
          // Update both local and remote with chosen data
          await firebaseSync.applyRemoteChanges(conflict.collection, [dataToApply as any]);
          
          resolvedIds.push(`${conflict.collection}-${conflict.documentId}`);
        }
      }
      
      // Clear resolved conflicts
      firebaseSync.clearResolvedConflicts(resolvedIds);
      
      setState(prev => ({
        ...prev,
        pendingConflicts: prev.pendingConflicts.filter(c => 
          !resolvedIds.includes(`${c.collection}-${c.documentId}`)
        ),
      }));
      
      logger.info("Conflicts resolved", { resolvedCount: resolvedIds.length });
      
    } catch (error) {
      logger.error("Failed to resolve conflicts", { error: error as Error });
      setState(prev => ({ ...prev, error: error as Error }));
      throw error;
    }
  }, [state.pendingConflicts]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    sync,
    resolveConflicts,
    clearError,
  };
};