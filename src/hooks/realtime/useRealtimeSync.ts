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
  RealtimeUpdate,
  Subscription,
} from "../../types/realtime";
import {
  connectWebSocket,
  createChannelHelpers,
  createSubscriptionHelpers,
} from "./useRealtimeSync-operations";

interface WebSocketMessage {
  type: string;
  data?: unknown;
  channelId?: string;
  userId?: string;
  timestamp?: Date;
}

interface UseRealtimeSyncOptions {
  userId: string;
  autoConnect?: boolean;
  reconnectInterval?: number; // milliseconds
  heartbeatInterval?: number; // milliseconds
  maxReconnectAttempts?: number;
}

// Complex real-time synchronization hook with WebSocket management
// eslint-disable-next-line max-statements
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
  const reconnectTimeoutRef = useRef<number | null>(null);
  const heartbeatTimeoutRef = useRef<number | null>(null);
  const connectionStartTimeRef = useRef<Date | null>(null);

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000, "Intentional disconnect");
      wsRef.current = null;
    }

    stopHeartbeat();

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // stopHeartbeat is stable

  // Attempt reconnection
  const attemptReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      // Max reconnection attempts reached
      return;
    }

    reconnectAttemptsRef.current++;

    setSyncState((prev) => ({
      ...prev,
      connectionStatus: ConnectionStatus.RECONNECTING,
    }));

    reconnectTimeoutRef.current = setTimeout(() => {
      // Reconnection attempt
      connect();
    }, reconnectInterval);
  }, [connect, maxReconnectAttempts, reconnectInterval]);

  // Start heartbeat
  const startHeartbeat = useCallback(() => {
    const sendHeartbeat = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        sendMessage({ type: "heartbeat", timestamp: new Date().toISOString() });
        heartbeatTimeoutRef.current = setTimeout(
          sendHeartbeat,
          heartbeatInterval,
        );
      }
    };

    heartbeatTimeoutRef.current = setTimeout(sendHeartbeat, heartbeatInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heartbeatInterval]); // sendMessage is stable

  // Stop heartbeat
  const stopHeartbeat = useCallback(() => {
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }
  }, []);

  // Send message via WebSocket
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));

      setSyncState((prev) => ({
        ...prev,
        syncMetrics: {
          ...prev.syncMetrics,
          messagesSent: prev.syncMetrics.messagesSent + 1,
        },
      }));
    }
  }, []);

  // Handle incoming messages
  const handleMessage = useCallback((message: WebSocketMessage) => {
    setSyncState((prev) => ({
      ...prev,
      syncMetrics: {
        ...prev.syncMetrics,
        messagesReceived: prev.syncMetrics.messagesReceived + 1,
        lastSuccessfulSync: new Date(),
      },
    }));

    switch (message.type) {
      case "channel_joined":
        handleChannelJoined(message);
        break;
      case "channel_left":
        handleChannelLeft(message);
        break;
      case "realtime_update":
        handleRealtimeUpdate(message);
        break;
      case "heartbeat_ack":
        // Heartbeat acknowledged
        break;
      default:
      // Unknown message type
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // handler functions are stable

  // Handle channel joined
  const handleChannelJoined = useCallback((message: WebSocketMessage) => {
    const channel: SyncChannel = message.data as SyncChannel;

    setSyncState((prev) => ({
      ...prev,
      activeChannels: [
        ...prev.activeChannels.filter((c) => c.id !== channel.id),
        channel,
      ],
    }));
  }, []);

  // Handle channel left
  const handleChannelLeft = useCallback((message: WebSocketMessage) => {
    const channelId = (message.data as { channelId: string })?.channelId;

    setSyncState((prev) => ({
      ...prev,
      activeChannels: prev.activeChannels.filter((c) => c.id !== channelId),
    }));
  }, []);

  // Handle realtime update
  const handleRealtimeUpdate = useCallback((message: WebSocketMessage) => {
    const update: RealtimeUpdate = message.data as RealtimeUpdate;

    // Update local data
    setSyncState((prev) => ({
      ...prev,
      realtimeData: {
        ...prev.realtimeData,
        [update.type]: update.data,
      },
    }));

    // Notify subscribers
    subscriptionsRef.current.forEach((subscription, _subscriptionId) => {
      if (subscription.dataType === update.type && subscription.isActive) {
        try {
          subscription.callback(update);
        } catch {
          // Error in subscription callback
        }
      }
    });
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    connectWebSocket({
      wsRef,
      userId,
      connectionStartTimeRef,
      reconnectAttemptsRef,
      setSyncState,
      startHeartbeat,
      stopHeartbeat,
      attemptReconnect,
      sendMessage,
      handleMessage,
      activeChannels: syncState.activeChannels,
      maxReconnectAttempts,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    userId,
    maxReconnectAttempts,
    startHeartbeat,
    stopHeartbeat,
    attemptReconnect,
    sendMessage,
    handleMessage,
  ]);

  // Channel management functions
  const channelHelpers = useMemo(
    () => createChannelHelpers(wsRef, userId, sendMessage),
    [userId, sendMessage],
  );
  const { joinChannel, leaveChannel, createChannel } = channelHelpers;

  // Subscription functions
  const subscriptionHelpers = useMemo(
    () =>
      createSubscriptionHelpers(subscriptionsRef, wsRef, userId, sendMessage),
    [userId, sendMessage],
  );
  const { subscribeToUpdates, publishUpdate } = subscriptionHelpers;

  // Sync with keyholder
  const syncWithKeyholder = useCallback(
    async (relationshipId: string): Promise<void> => {
      const channelId = `relationship_${relationshipId}`;
      await joinChannel(channelId);
    },
    [joinChannel],
  );

  // Sync session data
  const syncSessionData = useCallback(
    async (sessionId: string): Promise<void> => {
      const channelId = `session_${sessionId}`;
      await joinChannel(channelId);
    },
    [joinChannel],
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
