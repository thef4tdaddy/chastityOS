/**
 * Helper functions for useRealtimeSync hook
 */
import React, { type MutableRefObject } from "react";
import {
  ConnectionStatus,
  ChannelType,
  type RealtimeSyncState,
  type SyncChannel,
  type RealtimeUpdate,
  type Subscription,
  type UpdateCallback,
} from "../../types/realtime";

interface WebSocketMessage {
  type: string;
  data?: unknown;
  channelId?: string;
  userId?: string;
  timestamp?: Date;
}

interface ConnectWebSocketParams {
  wsRef: MutableRefObject<WebSocket | null>;
  userId: string;
  connectionStartTimeRef: MutableRefObject<Date | null>;
  reconnectAttemptsRef: MutableRefObject<number>;
  setSyncState: React.Dispatch<React.SetStateAction<RealtimeSyncState>>;
  startHeartbeat: () => void;
  stopHeartbeat: () => void;
  attemptReconnect: () => void;
  sendMessage: (message: WebSocketMessage) => void;
  handleMessage: (message: WebSocketMessage) => void;
  activeChannels: SyncChannel[];
  maxReconnectAttempts: number;
}

export const connectWebSocket = (params: ConnectWebSocketParams): void => {
  const {
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
    activeChannels,
    maxReconnectAttempts,
  } = params;

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
      activeChannels.forEach((channel) => {
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
};

// Channel management functions
export const createChannelHelpers = (
  wsRef: MutableRefObject<WebSocket | null>,
  userId: string,
  sendMessage: (message: WebSocketMessage) => void,
) => {
  const joinChannel = async (channelId: string): Promise<void> => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      sendMessage({
        type: "join_channel",
        channelId,
        userId,
      });
    } else {
      throw new Error("WebSocket not connected");
    }
  };

  const leaveChannel = async (channelId: string): Promise<void> => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      sendMessage({
        type: "leave_channel",
        channelId,
        userId,
      });
    }
  };

  const createChannel = async (
    type: ChannelType,
    participants: string[],
  ): Promise<SyncChannel> => {
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
  };

  return { joinChannel, leaveChannel, createChannel };
};

// Subscription functions
export const createSubscriptionHelpers = (
  subscriptionsRef: MutableRefObject<Map<string, Subscription>>,
  wsRef: MutableRefObject<WebSocket | null>,
  userId: string,
  sendMessage: (message: WebSocketMessage) => void,
) => {
  const subscribeToUpdates = (
    dataType: string,
    callback: UpdateCallback,
  ): Subscription => {
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
  };

  const publishUpdate = async (update: RealtimeUpdate): Promise<void> => {
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
  };

  return { subscribeToUpdates, publishUpdate };
};
