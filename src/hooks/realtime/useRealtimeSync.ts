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
  SyncChannel,
  ChannelType,
  RealtimeUpdate,
  RealtimeDataState,
  RealtimeSyncMetrics,
  Subscription,
  UpdateCallback,
} from "../../types/realtime";
import {
  calculateConnectionUptime,
} from "./realtimeSyncHelpers";
import {
  createWebSocketFunctions,
  createChannelFunctions,
  createRealtimeSubscriptionFunctions,
  createRelationshipSyncFunctions,
} from "./realtimeSyncOperations";

interface UseRealtimeSyncOptions {
  userId: string;
  autoConnect?: boolean;
  reconnectInterval?: number; // milliseconds
  heartbeatInterval?: number; // milliseconds
  maxReconnectAttempts?: number;
}

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
  const subscriptionsRef = useRef<Map<string, Subscription>>(new Map());
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectionStartTimeRef = useRef<Date | null>(null);

  // Create WebSocket functions using helper
  const webSocketFunctions = createWebSocketFunctions(
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
    heartbeatInterval
  );

  const { connect, disconnect, sendMessage } = webSocketFunctions;

  // Create channel management functions
  const channelFunctions = createChannelFunctions(userId, sendMessage);
  const { joinChannel, leaveChannel, createChannel } = channelFunctions;

  // Create subscription functions
  const subscriptionFunctions = createRealtimeSubscriptionFunctions(subscriptionsRef);
  const { subscribeToUpdates, publishUpdate } = subscriptionFunctions;

  // Create relationship sync functions
  const relationshipFunctions = createRelationshipSyncFunctions(joinChannel);
  const { syncWithKeyholder, syncSessionData } = relationshipFunctions;

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

  // Computed values
  const computedValues = useMemo(() => {
    const isConnected =
      syncState.connectionStatus === ConnectionStatus.CONNECTED;
    const channelCount = syncState.activeChannels.length;
    const lastSyncTime = syncState.syncMetrics.lastSuccessfulSync;
    const hasActiveSync = syncState.activeChannels.some((c) => c.isActive);

    return {
      isConnected,
      channelCount,
      lastSyncTime,
      hasActiveSync,
    };
  }, [syncState]);

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
    ...computedValues,
  };
};
