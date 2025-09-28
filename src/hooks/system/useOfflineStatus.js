import { useState, useEffect, useCallback } from 'react';
import * as Sentry from '@sentry/react';

/**
 * Network status monitoring hook with offline capabilities and intelligent sync
 * @returns {object} Network status and sync management functions
 */
export const useOfflineStatus = () => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [connectionQuality, setConnectionQuality] = useState('unknown'); // 'poor', 'good', 'excellent', 'unknown'
  const [lastOnlineTime, setLastOnlineTime] = useState(null);
  const [offlineDuration, setOfflineDuration] = useState(0);
  const [pendingSyncOperations, setPendingSyncOperations] = useState([]);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle', 'syncing', 'error'
  const [connectionInfo, setConnectionInfo] = useState({
    type: 'unknown',
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0
  });

  // Queue for offline operations
  const addPendingOperation = useCallback((operation) => {
    setPendingSyncOperations(prev => [...prev, {
      id: Date.now() + Math.random(),
      operation,
      timestamp: new Date(),
      retryCount: 0
    }]);
  }, []);

  // Remove completed operation
  const removePendingOperation = useCallback((operationId) => {
    setPendingSyncOperations(prev => prev.filter(op => op.id !== operationId));
  }, []);

  // Test connection quality
  const testConnectionQuality = useCallback(async () => {
    if (!isOnline) {
      setConnectionQuality('offline');
      return 'offline';
    }

    try {
      const start = performance.now();
      // Test with a small image from a reliable CDN
      const response = await fetch('https://httpbin.org/status/200', {
        method: 'HEAD',
        cache: 'no-cache'
      });
      const end = performance.now();
      const responseTime = end - start;

      let quality = 'unknown';
      if (response.ok) {
        if (responseTime < 300) {
          quality = 'excellent';
        } else if (responseTime < 1000) {
          quality = 'good';
        } else {
          quality = 'poor';
        }
      }
      
      setConnectionQuality(quality);
      return quality;
    } catch (error) {
      console.warn('Connection quality test failed:', error);
      setConnectionQuality('poor');
      return 'poor';
    }
  }, [isOnline]);

  // Retry pending operations
  const retryPendingOperations = useCallback(async () => {
    if (!isOnline || pendingSyncOperations.length === 0) return;

    setSyncStatus('syncing');
    const failedOperations = [];

    try {
      for (const pendingOp of pendingSyncOperations) {
        try {
          await pendingOp.operation();
          removePendingOperation(pendingOp.id);
        } catch (error) {
          console.error('Failed to sync operation:', error);
          Sentry.captureException(error);
          
          // Retry logic - maximum 3 retries
          if (pendingOp.retryCount < 3) {
            failedOperations.push({
              ...pendingOp,
              retryCount: pendingOp.retryCount + 1
            });
          } else {
            // Give up after 3 retries
            removePendingOperation(pendingOp.id);
          }
        }
      }

      // Update pending operations with failed ones that still have retries
      setPendingSyncOperations(failedOperations);
      setSyncStatus(failedOperations.length > 0 ? 'error' : 'idle');
    } catch (error) {
      console.error('Error during sync operation:', error);
      Sentry.captureException(error);
      setSyncStatus('error');
    }
  }, [isOnline, pendingSyncOperations, removePendingOperation]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      const now = new Date();
      
      // Calculate offline duration
      if (lastOnlineTime) {
        const duration = now.getTime() - lastOnlineTime.getTime();
        setOfflineDuration(duration);
      }
      
      setLastOnlineTime(now);
      
      // Test connection quality when coming back online
      await testConnectionQuality();
      
      // Retry pending operations after a short delay
      setTimeout(() => {
        retryPendingOperations();
      }, 1000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setConnectionQuality('offline');
      setLastOnlineTime(new Date());
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial connection quality test
    if (isOnline) {
      testConnectionQuality();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [testConnectionQuality, retryPendingOperations, lastOnlineTime]);

  // Monitor connection info if available
  useEffect(() => {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      
      const updateConnectionInfo = () => {
        setConnectionInfo({
          type: connection.type || 'unknown',
          effectiveType: connection.effectiveType || 'unknown',
          downlink: connection.downlink || 0,
          rtt: connection.rtt || 0
        });
      };

      updateConnectionInfo();
      connection.addEventListener('change', updateConnectionInfo);

      return () => {
        connection.removeEventListener('change', updateConnectionInfo);
      };
    }
  }, []);

  // Periodic connection quality testing
  useEffect(() => {
    if (!isOnline) return;

    const interval = setInterval(() => {
      testConnectionQuality();
    }, 30000); // Test every 30 seconds

    return () => clearInterval(interval);
  }, [isOnline, testConnectionQuality]);

  // Helper function to execute operation with offline support
  const executeWithOfflineSupport = useCallback(async (operation, fallbackData = null) => {
    if (isOnline) {
      try {
        return await operation();
      } catch (error) {
        // If online but operation fails, queue for retry
        addPendingOperation(operation);
        
        if (fallbackData) {
          console.warn('Operation failed while online, using fallback data:', error);
          return fallbackData;
        }
        throw error;
      }
    } else {
      // Offline - queue operation and return fallback
      addPendingOperation(operation);
      
      if (fallbackData) {
        return fallbackData;
      } else {
        throw new Error('Operation not available offline and no fallback data provided');
      }
    }
  }, [isOnline, addPendingOperation]);

  // Format offline duration for display
  const formatOfflineDuration = useCallback((duration) => {
    if (!duration) return '0s';
    
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }, []);

  return {
    // Status
    isOnline,
    connectionQuality,
    lastOnlineTime,
    offlineDuration,
    connectionInfo,
    
    // Sync management
    pendingSyncOperations,
    syncStatus,
    addPendingOperation,
    removePendingOperation,
    retryPendingOperations,
    
    // Utilities
    testConnectionQuality,
    executeWithOfflineSupport,
    formatOfflineDuration,
    
    // Computed values
    hasPendingOperations: pendingSyncOperations.length > 0,
    isSlowConnection: connectionQuality === 'poor',
    offlineDurationFormatted: formatOfflineDuration(offlineDuration)
  };
};