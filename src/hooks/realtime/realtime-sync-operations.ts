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
} from "../../utils/realtime/realtimeSyncHelpers";

// Helper to create sendMessage function
const createSendMessage = (
  wsRef: React.MutableRefObject<WebSocket | null>,
  setSyncState: React.Dispatch<React.SetStateAction<RealtimeSyncState>>,
) => {
  return (message: RealtimeUpdate | Record<string, unknown>) => {
    sendWebSocketMessage(wsRef.current, message, () => {
      setSyncState((prev) => ({
        ...prev,
        syncMetrics: updateSyncMetrics(prev.syncMetrics, "messageSent"),
      }));
    });
  };
};

// Config interface for connection setup
interface ConnectConfig {
  wsRef: React.MutableRefObject<WebSocket | null>;
  setSyncState: React.Dispatch<React.SetStateAction<RealtimeSyncState>>;
  connectionStartTimeRef: React.MutableRefObject<Date | null>;
  reconnectAttemptsRef: React.MutableRefObject<number>;
  maxReconnectAttempts: number;
  userId: string;
  handleMessage: (message: Record<string, unknown>) => void;
  startHeartbeat: () => void;
  stopHeartbeat: () => void;
  attemptReconnect: () => void;
}

// Helper to create the connect function
const createConnectFunction = (config: ConnectConfig) => {
  const {
    wsRef,
    setSyncState,
    connectionStartTimeRef,
    reconnectAttemptsRef,
    maxReconnectAttempts,
    userId,
    handleMessage,
    startHeartbeat,
    stopHeartbeat,
    attemptReconnect,
  } = config;
  return () => {
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

      setupWebSocketHandlers({
        ws: wsRef.current,
        setSyncState,
        reconnectAttemptsRef,
        maxReconnectAttempts,
        handleMessage,
        startHeartbeat,
        stopHeartbeat,
        attemptReconnect,
      });
    } catch {
      setSyncState((prev) => ({
        ...prev,
        connectionStatus: ConnectionStatus.ERROR,
      }));
    }
  };
};

// Config interface for connection control
interface ConnectionControlConfig {
  wsRef: React.MutableRefObject<WebSocket | null>;
  setSyncState: React.Dispatch<React.SetStateAction<RealtimeSyncState>>;
  reconnectAttemptsRef: React.MutableRefObject<number>;
  reconnectTimeoutRef: React.MutableRefObject<ReturnType<
    typeof setTimeout
  > | null>;
  maxReconnectAttempts: number;
  reconnectInterval: number;
  stopHeartbeat: () => void;
  connect: () => void;
}

// Helper to create connection control functions
const createConnectionControlFunctions = (config: ConnectionControlConfig) => {
  const {
    wsRef,
    setSyncState,
    reconnectAttemptsRef,
    reconnectTimeoutRef,
    maxReconnectAttempts,
    reconnectInterval,
    stopHeartbeat,
    connect,
  } = config;
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

  return { attemptReconnect, disconnect };
};

// Config interface for WebSocket handlers
interface WebSocketHandlersConfig {
  ws: WebSocket;
  setSyncState: React.Dispatch<React.SetStateAction<RealtimeSyncState>>;
  reconnectAttemptsRef: React.MutableRefObject<number>;
  maxReconnectAttempts: number;
  handleMessage: (message: Record<string, unknown>) => void;
  startHeartbeat: () => void;
  stopHeartbeat: () => void;
  attemptReconnect: () => void;
}

// Helper to setup WebSocket event handlers
const setupWebSocketHandlers = (config: WebSocketHandlersConfig) => {
  const {
    ws,
    setSyncState,
    reconnectAttemptsRef,
    maxReconnectAttempts,
    handleMessage,
    startHeartbeat,
    stopHeartbeat,
    attemptReconnect,
  } = config;
  ws.onopen = () => {
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

  ws.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      handleMessage(message);
    } catch {
      // Failed to parse WebSocket message
    }
  };

  ws.onclose = (event) => {
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

  ws.onerror = (_error) => {
    setSyncState((prev) => ({
      ...prev,
      connectionStatus: ConnectionStatus.ERROR,
      syncMetrics: updateSyncMetrics(prev.syncMetrics, "error"),
    }));
  };
};

// Helper to create message handlers
const createMessageHandlers = (
  setSyncState: React.Dispatch<React.SetStateAction<RealtimeSyncState>>,
  subscriptionsRef: React.MutableRefObject<{ [key: string]: Subscription }>,
) => {
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

  const handleMessage = (message: Record<string, unknown>) => {
    setSyncState((prev) => ({
      ...prev,
      syncMetrics: updateSyncMetrics(prev.syncMetrics, "messageReceived"),
    }));

    switch (message.type) {
      case "channel_joined":
        handleChannelJoined(message as Record<string, unknown>);
        break;
      case "channel_left":
        handleChannelLeft(message as Record<string, unknown>);
        break;
      case "realtime_update":
        handleRealtimeUpdate(message as RealtimeUpdate);
        break;
      case "heartbeat_ack":
        // Heartbeat acknowledged
        break;
      default:
      // Unknown message type
    }
  };

  return { handleMessage };
};

// Helper to create heartbeat functions
const createHeartbeatFunctions = (
  wsRef: React.MutableRefObject<WebSocket | null>,
  heartbeatTimeoutRef: React.MutableRefObject<ReturnType<
    typeof setTimeout
  > | null>,
  heartbeatInterval: number,
  sendMessage: (message: RealtimeUpdate | Record<string, unknown>) => void,
) => {
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

  return { startHeartbeat, stopHeartbeat };
};

// Config interface for WebSocket functions
export interface WebSocketFunctionsConfig {
  userId: string;
  setSyncState: React.Dispatch<React.SetStateAction<RealtimeSyncState>>;
  wsRef: React.MutableRefObject<WebSocket | null>;
  subscriptionsRef: React.MutableRefObject<{ [key: string]: Subscription }>;
  reconnectAttemptsRef: React.MutableRefObject<number>;
  reconnectTimeoutRef: React.MutableRefObject<ReturnType<
    typeof setTimeout
  > | null>;
  heartbeatTimeoutRef: React.MutableRefObject<ReturnType<
    typeof setTimeout
  > | null>;
  connectionStartTimeRef: React.MutableRefObject<Date | null>;
  maxReconnectAttempts: number;
  reconnectInterval: number;
  heartbeatInterval: number;
}

// Helper function to create WebSocket connection functions
export const createWebSocketFunctions = (config: WebSocketFunctionsConfig) => {
  const {
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
  } = config;
  const sendMessage = createSendMessage(wsRef, setSyncState);

  const { startHeartbeat, stopHeartbeat } = createHeartbeatFunctions(
    wsRef,
    heartbeatTimeoutRef,
    heartbeatInterval,
    sendMessage,
  );

  const { handleMessage } = createMessageHandlers(
    setSyncState,
    subscriptionsRef,
  );

  let connect: () => void;

  const { attemptReconnect, disconnect } = createConnectionControlFunctions({
    wsRef,
    setSyncState,
    reconnectAttemptsRef,
    reconnectTimeoutRef,
    maxReconnectAttempts,
    reconnectInterval,
    stopHeartbeat,
    connect: () => connect(),
  });

  connect = createConnectFunction({
    wsRef,
    setSyncState,
    connectionStartTimeRef,
    reconnectAttemptsRef,
    maxReconnectAttempts,
    userId,
    handleMessage,
    startHeartbeat,
    stopHeartbeat,
    attemptReconnect,
  });

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
