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
  Subscription,
  UpdateCallback,
} from "../../types/realtime";

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

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    setSyncState((prev) => ({
      ...prev,
      connectionStatus: ConnectionStatus.CONNECTING,
    }));

    try {
      // In real implementation, use your WebSocket server URL
      const wsUrl =
        process.env.NODE_ENV === "development"
          ? "ws://localhost:8080/ws"
          : "wss://api.chastityos.com/ws";

      wsRef.current = new WebSocket(`${wsUrl}?userId=${userId}`);
      connectionStartTimeRef.current = new Date();

      wsRef.current.onopen = () => {
        // WebSocket connected
        reconnectAttemptsRef.current = 0;

        setSyncState((prev) => ({
          ...prev,
          connectionStatus: ConnectionStatus.CONNECTED,
        }));

        // Start heartbeat
        startHeartbeat();

        // Rejoin previous channels
        syncState.activeChannels.forEach((channel) => {
          sendMessage({
            type: "join_channel",
            channelId: channel.id,
            userId,
          });
        });
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleMessage(message);
        } catch {
          // Failed to parse WebSocket message
        }
      };

      wsRef.current.onclose = (event) => {
        // WebSocket disconnected

        setSyncState((prev) => ({
          ...prev,
          connectionStatus: ConnectionStatus.DISCONNECTED,
        }));

        stopHeartbeat();

        // Attempt reconnection if not intentional disconnect
        if (
          event.code !== 1000 &&
          reconnectAttemptsRef.current < maxReconnectAttempts
        ) {
          attemptReconnect();
        }
      };

      wsRef.current.onerror = (_error) => {
        // WebSocket error

        setSyncState((prev) => ({
          ...prev,
          connectionStatus: ConnectionStatus.ERROR,
          syncMetrics: {
            ...prev.syncMetrics,
            syncErrors: prev.syncMetrics.syncErrors + 1,
          },
        }));
      };
    } catch {
      // Failed to create WebSocket connection
      setSyncState((prev) => ({
        ...prev,
        connectionStatus: ConnectionStatus.ERROR,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, maxReconnectAttempts]);

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

  // Join a sync channel
  const joinChannel = useCallback(
    async (channelId: string): Promise<void> => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        sendMessage({
          type: "join_channel",
          channelId,
          userId,
        });
      } else {
        throw new Error("WebSocket not connected");
      }
    },
    [userId, sendMessage],
  );

  // Leave a sync channel
  const leaveChannel = useCallback(
    async (channelId: string): Promise<void> => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        sendMessage({
          type: "leave_channel",
          channelId,
          userId,
        });
      }
    },
    [userId, sendMessage],
  );

  // Create a new sync channel
  const createChannel = useCallback(
    async (type: ChannelType, participants: string[]): Promise<SyncChannel> => {
      const channel: SyncChannel = {
        id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        participants: [userId, ...participants],
        lastActivity: new Date(),
        isActive: true,
        encryptionEnabled: type === ChannelType.RELATIONSHIP,
      };

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        sendMessage({
          type: "create_channel",
          channel,
          userId,
        });
      }

      return channel;
    },
    [userId, sendMessage],
  );

  // Subscribe to realtime updates
  const subscribeToUpdates = useCallback(
    (dataType: string, callback: UpdateCallback): Subscription => {
      const subscription: Subscription = {
        id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        dataType,
        callback,
        isActive: true,
        created: new Date(),
      };

      subscriptionsRef.current.set(subscription.id, subscription);

      // Return unsubscribe function
      return {
        ...subscription,
        unsubscribe: () => {
          const sub = subscriptionsRef.current.get(subscription.id);
          if (sub) {
            sub.isActive = false;
            subscriptionsRef.current.delete(subscription.id);
          }
        },
      } as Subscription & { unsubscribe: () => void };
    },
    [],
  );

  // Publish a realtime update
  const publishUpdate = useCallback(
    async (update: RealtimeUpdate): Promise<void> => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        sendMessage({
          type: "publish_update",
          update: {
            ...update,
            userId,
            timestamp: new Date(),
          },
        });
      } else {
        throw new Error("WebSocket not connected");
      }
    },
    [userId, sendMessage],
  );

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
