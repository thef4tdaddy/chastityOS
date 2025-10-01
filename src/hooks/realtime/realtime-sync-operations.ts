/**
 * Realtime sync operation helper functions
 */
import React from "react";
import {
  RealtimeSyncState,
  ConnectionStatus,
  SyncChannel,
  ChannelType,
  RealtimeUpdate,
  Subscription,
} from "../../types/realtime";
import {
  createWebSocketUrl,
  createSyncChannel,
  sendWebSocketMessage,
  updateSyncMetrics,
  shouldAttemptReconnection,
  createSubscription,
  notifySubscribers as _notifySubscribers,
} from "./realtimeSyncHelpers";

// Helper function to create WebSocket connection functions
export const createWebSocketFunctions = (
  userId: string,
  setSyncState: React.Dispatch<React.SetStateAction<RealtimeSyncState>>,
  wsRef: React.MutableRefObject<WebSocket | null>,
  subscriptionsRef: React.MutableRefObject<{ [key: string]: Subscription }>,
  reconnectAttemptsRef: React.MutableRefObject<number>,
  reconnectTimeoutRef: React.MutableRefObject<ReturnType<
    typeof setTimeout
  > | null>,
  heartbeatTimeoutRef: React.MutableRefObject<ReturnType<
    typeof setTimeout
  > | null>,
  connectionStartTimeRef: React.MutableRefObject<Date | null>,
  maxReconnectAttempts: number,
  reconnectInterval: number,
  heartbeatInterval: number,
) => {
  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    setSyncState((prev) => ({
      ...prev,
      connectionStatus: ConnectionStatus.CONNECTING,
    }));

    try {
      const wsUrl = createWebSocketUrl(userId);
      wsRef.current = new WebSocket(wsUrl);
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
        // Implementation would go here
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
        setSyncState((prev) => ({
          ...prev,
          connectionStatus: ConnectionStatus.DISCONNECTED,
        }));

        stopHeartbeat();

        if (
          shouldAttemptReconnection(
            event,
            reconnectAttemptsRef.current,
            maxReconnectAttempts,
          )
        ) {
          attemptReconnect();
        }
      };

      wsRef.current.onerror = (_error) => {
        setSyncState((prev) => ({
          ...prev,
          connectionStatus: ConnectionStatus.ERROR,
          syncMetrics: updateSyncMetrics(prev.syncMetrics, "error"),
        }));
      };
    } catch {
      setSyncState((prev) => ({
        ...prev,
        connectionStatus: ConnectionStatus.ERROR,
      }));
    }
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close(1000, "Intentional disconnect");
      wsRef.current = null;
    }

    stopHeartbeat();

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  const attemptReconnect = () => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      return;
    }

    reconnectAttemptsRef.current++;

    setSyncState((prev) => ({
      ...prev,
      connectionStatus: ConnectionStatus.RECONNECTING,
    }));

    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, reconnectInterval);
  };

  const startHeartbeat = () => {
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
  };

  const stopHeartbeat = () => {
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }
  };

  const sendMessage = (message: RealtimeUpdate | Record<string, unknown>) => {
    const success = sendWebSocketMessage(wsRef.current, message, () => {
      setSyncState((prev) => ({
        ...prev,
        syncMetrics: updateSyncMetrics(prev.syncMetrics, "messageSent"),
      }));
    });
  };

  const handleMessage = (message: Record<string, unknown>) => {
    setSyncState((prev) => ({
      ...prev,
      syncMetrics: updateSyncMetrics(prev.syncMetrics, "messageReceived"),
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
  };

  const handleChannelJoined = (message: { channel: SyncChannel }) => {
    const channel: SyncChannel = message.channel;

    setSyncState((prev) => ({
      ...prev,
      activeChannels: [
        ...prev.activeChannels.filter((c) => c.id !== channel.id),
        channel,
      ],
    }));
  };

  const handleChannelLeft = (message: { channelId: string }) => {
    const channelId = message.channelId;

    setSyncState((prev) => ({
      ...prev,
      activeChannels: prev.activeChannels.filter((c) => c.id !== channelId),
    }));
  };

  const handleRealtimeUpdate = (message: { update: RealtimeUpdate }) => {
    const update: RealtimeUpdate = message.update;

    // Update local data
    setSyncState((prev) => ({
      ...prev,
      realtimeData: {
        ...prev.realtimeData,
        [update.type]: update.data,
      },
    }));

    // Notify subscribers - using object instead of Map
    const subscriptionKeys = Object.keys(subscriptionsRef.current);
    for (let i = 0; i < subscriptionKeys.length; i++) {
      const key = subscriptionKeys[i];
      const subscription = subscriptionsRef.current[key];
      if (subscription.dataType === update.type && subscription.isActive) {
        try {
          subscription.callback(update);
        } catch {
          // Error in subscription callback
        }
      }
    }
  };

  return {
    connect,
    disconnect,
    sendMessage,
    startHeartbeat,
    stopHeartbeat,
  };
};

// Helper function to create channel management functions
export const createChannelFunctions = (
  userId: string,
  sendMessage: (message: RealtimeUpdate | Record<string, unknown>) => void,
) => {
  const joinChannel = async (channelId: string): Promise<void> => {
    sendMessage({
      type: "join_channel",
      channelId,
      userId,
    });
  };

  const leaveChannel = async (channelId: string): Promise<void> => {
    sendMessage({
      type: "leave_channel",
      channelId,
      userId,
    });
  };

  const createChannel = async (
    type: ChannelType,
    participants: string[],
  ): Promise<SyncChannel> => {
    const channel = createSyncChannel(type, userId, participants);

    sendMessage({
      type: "create_channel",
      channel,
      userId,
    });

    return channel;
  };

  return {
    joinChannel,
    leaveChannel,
    createChannel,
  };
};

// Helper function to create subscription functions
export const createRealtimeSubscriptionFunctions = (
  subscriptionsRef: React.MutableRefObject<{ [key: string]: Subscription }>,
) => {
  const subscribeToUpdates = (
    dataType: string,
    callback: (update: RealtimeUpdate) => void,
  ): Subscription => {
    const subscription = createSubscription(dataType, callback);
    subscriptionsRef.current[subscription.id] = subscription;

    // Return unsubscribe function
    return {
      ...subscription,
      unsubscribe: () => {
        const sub = subscriptionsRef.current[subscription.id];
        if (sub) {
          sub.isActive = false;
          delete subscriptionsRef.current[subscription.id];
        }
      },
    } as Subscription & { unsubscribe: () => void };
  };

  const publishUpdate = async (_update: RealtimeUpdate): Promise<void> => {
    // Implementation would send the update via WebSocket
  };

  return {
    subscribeToUpdates,
    publishUpdate,
  };
};

// Helper function to create relationship sync functions
export const createRelationshipSyncFunctions = (
  joinChannel: (channelId: string) => Promise<void>,
) => {
  const syncWithKeyholder = async (relationshipId: string): Promise<void> => {
    const channelId = `relationship_${relationshipId}`;
    await joinChannel(channelId);
  };

  const syncSessionData = async (sessionId: string): Promise<void> => {
    const channelId = `session_${sessionId}`;
    await joinChannel(channelId);
  };

  return {
    syncWithKeyholder,
    syncSessionData,
  };
};
