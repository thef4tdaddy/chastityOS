/**
 * Realtime sync helper functions
 */
import {
  RealtimeUpdate,
  Subscription,
  SyncChannel,
  ChannelType,
  ConnectionStatus as _ConnectionStatus,
} from "../../types/realtime";

// Helper function to create WebSocket URL
export function createWebSocketUrl(userId: string): string {
  const wsUrl =
    process.env.NODE_ENV === "development"
      ? "ws://localhost:8080/ws"
      : "wss://api.chastityos.com/ws";

  return `${wsUrl}?userId=${userId}`;
}

// Helper function to create sync channel
export function createSyncChannel(
  type: ChannelType,
  userId: string,
  participants: string[],
): SyncChannel {
  return {
    id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    participants: [userId, ...participants],
    lastActivity: new Date(),
    isActive: true,
    encryptionEnabled: type === ChannelType.RELATIONSHIP,
  };
}

// Helper function to send WebSocket message
export function sendWebSocketMessage(
  ws: WebSocket | null,
  message: { [key: string]: any },
  updateMessagesSent: () => void,
): boolean {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
    updateMessagesSent();
    return true;
  }
  return false;
}

// Helper function to update sync metrics
export function updateSyncMetrics(
  prevMetrics: { [key: string]: any },
  type: "success" | "error" | "messageReceived" | "messageSent",
): { [key: string]: any } {
  const now = new Date();

  switch (type) {
    case "success":
      return {
        ...prevMetrics,
        lastSuccessfulSync: now,
      };
    case "error":
      return {
        ...prevMetrics,
        syncErrors: prevMetrics.syncErrors + 1,
      };
    case "messageReceived":
      return {
        ...prevMetrics,
        messagesReceived: prevMetrics.messagesReceived + 1,
        lastSuccessfulSync: now,
      };
    case "messageSent":
      return {
        ...prevMetrics,
        messagesSent: prevMetrics.messagesSent + 1,
      };
    default:
      return prevMetrics;
  }
}

// Helper function to calculate connection uptime
export function calculateConnectionUptime(
  connectionStartTime: Date | null,
): number {
  if (!connectionStartTime) return 0;
  return Date.now() - connectionStartTime.getTime();
}

// Helper function to check if should attempt reconnection
export function shouldAttemptReconnection(
  event: CloseEvent,
  reconnectAttempts: number,
  maxReconnectAttempts: number,
): boolean {
  return event.code !== 1000 && reconnectAttempts < maxReconnectAttempts;
}

// Helper function to create subscription
export function createSubscription(
  dataType: string,
  callback: (update: RealtimeUpdate) => void,
): Subscription {
  return {
    id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    dataType,
    callback,
    isActive: true,
    created: new Date(),
  };
}

// Helper function to notify subscribers
export function notifySubscribers(
  subscriptions: { [key: string]: Subscription },
  update: RealtimeUpdate,
): void {
  const keys = Object.keys(subscriptions);
  for (let i = 0; i < keys.length; i++) {
    const subscription = subscriptions[keys[i]];
    if (subscription.dataType === update.type && subscription.isActive) {
      try {
        subscription.callback(update);
      } catch (_error) {
        // Error in subscription callback
      }
    }
  }
}
