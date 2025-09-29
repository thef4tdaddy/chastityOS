import { useState, useCallback, useEffect } from 'react';

interface SyncState {
  isLoading: boolean;
  lastSyncTime: Date | null;
  error: string | null;
  isConnected: boolean;
}

interface UseDataSyncProps {
  userId: string | null;
  isAuthReady: boolean;
}

export const useDataSync = ({ userId, isAuthReady }: UseDataSyncProps) => {
  const [syncState, setSyncState] = useState<SyncState>({
    isLoading: false,
    lastSyncTime: null,
    error: null,
    isConnected: navigator.onLine
  });

  const handleSyncData = useCallback(async () => {
    if (!userId || !isAuthReady) return;

    setSyncState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Simulate data sync operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSyncState(prev => ({
        ...prev,
        isLoading: false,
        lastSyncTime: new Date(),
        error: null
      }));
    } catch (error) {
      setSyncState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Sync failed'
      }));
    }
  }, [userId, isAuthReady]);

  const handleRetrySyncData = useCallback(() => {
    handleSyncData();
  }, [handleSyncData]);

  useEffect(() => {
    const handleOnline = () => {
      setSyncState(prev => ({ ...prev, isConnected: true }));
    };

    const handleOffline = () => {
      setSyncState(prev => ({ ...prev, isConnected: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-sync when coming online
  useEffect(() => {
    if (syncState.isConnected && userId && isAuthReady) {
      handleSyncData();
    }
  }, [syncState.isConnected, userId, isAuthReady, handleSyncData]);

  return {
    ...syncState,
    handleSyncData,
    handleRetrySyncData
  };
};