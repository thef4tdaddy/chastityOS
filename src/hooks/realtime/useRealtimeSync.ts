/**
 * useRealtimeSync - Real-time Data Synchronization Hook
 *
 * Real-time data synchronization across devices and users with WebSocket integration
 * and conflict resolution.
 */
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  RealtimeSyncState,
  ConnectionStatus,
  RealtimeUpdate,
  Subscription,
} from "../../types/realtime";

import {
  createWebSocketFunctions,
  createChannelFunctions,
  createRealtimeSubscriptionFunctions,
  createRelationshipSyncFunctions,
} from "./realtime-sync-operations";

interface UseRealtimeSyncOptions {
  userId: string;
  autoConnect?: boolean;
  reconnectInterval?: number; // milliseconds
  heartbeatInterval?: number; // milliseconds
  maxReconnectAttempts?: number;
}

// Complex real-time synchronization hook with WebSocket management
export const useRealtimeSync = (options: UseRealtimeSyncOptions) => {
  const {
    userId,
    autoConnect = true,
    reconnectInterval = 5000,
    heartbeatInterval = 30000,
    maxReconnectAttempts = 5,
  } = options;

  // Realtime sync state
  const [syncState, setSyncState] = useState<RealtimeSyncState>({
    connectionStatus: ConnectionStatus.DISCONNECTED,
    activeChannels: [],
    realtimeData: {},
    syncMetrics: {
      lastSuccessfulSync: new Date(),
      syncErrors: 0,
      messagesReceived: 0,
      messagesSent: 0,
      averageLatency: 0,
      connectionUptime: 0,
    },
  });

  // Refs for WebSocket and subscriptions
  const wsRef = useRef<WebSocket | null>(null);
  const subscriptionsRef = useRef<{ [key: string]: Subscription }>({});
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const heartbeatTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const connectionStartTimeRef = useRef<Date | null>(null);

  // WebSocket connection functions
  const wsFunctions = useMemo(
    () =>
      createWebSocketFunctions({
        userId,
        setSyncState,
        wsRef,
        subscriptionsRef,
        reconnectAttemptsRef,
        reconnectTimeoutRef,
        heartbeatTimeoutRef,
        connectionStartTimeRef,
        maxReconnectAttempts,
        reconnectInterval,
        heartbeatInterval,
      }),
    [userId, maxReconnectAttempts, reconnectInterval, heartbeatInterval],
  );

  const { connect, disconnect, sendMessage } = wsFunctions;

  // Channel management functions
  const channelFunctions = useMemo(
    () => createChannelFunctions(userId, sendMessage),
    [userId, sendMessage],
  );

  const { joinChannel, leaveChannel, createChannel } = channelFunctions;

  // Subscription functions
  const subscriptionFunctions = useMemo(
    () => createRealtimeSubscriptionFunctions(subscriptionsRef),
    [],
  );

  const { subscribeToUpdates } = subscriptionFunctions;

  // Relationship sync functions
  const relationshipSyncFunctions = useMemo(
    () => createRelationshipSyncFunctions(joinChannel),
    [joinChannel],
  );

  const { syncWithKeyholder, syncSessionData } = relationshipSyncFunctions;

  // Publish update function
  const publishUpdate = useCallback(
    async (update: RealtimeUpdate): Promise<void> => {
      sendMessage({
        type: "publish_update",
        update: {
          ...update,
          userId,
          timestamp: new Date(),
        },
      });
    },
    [userId, sendMessage],
  );

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && userId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [userId, autoConnect, connect, disconnect]);

  // Update connection uptime
  useEffect(() => {
    if (
      syncState.connectionStatus === ConnectionStatus.CONNECTED &&
      connectionStartTimeRef.current
    ) {
      const updateUptime = () => {
        setSyncState((prev) => ({
          ...prev,
          syncMetrics: {
            ...prev.syncMetrics,
            connectionUptime:
              Date.now() - connectionStartTimeRef.current!.getTime(),
          },
        }));
      };

      const interval = setInterval(updateUptime, 1000);
      return () => clearInterval(interval);
    }
  }, [syncState.connectionStatus]);

  // Computed values and return object
  return useMemo(() => {
    const isConnected =
      syncState.connectionStatus === ConnectionStatus.CONNECTED;
    const channelCount = syncState.activeChannels.length;
    const lastSyncTime = syncState.syncMetrics.lastSuccessfulSync;
    const hasActiveSync = syncState.activeChannels.some((c) => c.isActive);

    return {
      // Connection state
      connectionStatus: syncState.connectionStatus,
      activeChannels: syncState.activeChannels,
      syncMetrics: syncState.syncMetrics,
      // Connection control
      connect,
      disconnect,
      // Channel management
      joinChannel,
      leaveChannel,
      createChannel,
      // Real-time data operations
      subscribeToUpdates,
      publishUpdate,
      // Relationship-specific sync
      syncWithKeyholder,
      syncSessionData,
      // Computed values
      isConnected,
      channelCount,
      lastSyncTime,
      hasActiveSync,
    };
  }, [
    syncState,
    connect,
    disconnect,
    joinChannel,
    leaveChannel,
    createChannel,
    subscribeToUpdates,
    publishUpdate,
    syncWithKeyholder,
    syncSessionData,
  ]);
};
