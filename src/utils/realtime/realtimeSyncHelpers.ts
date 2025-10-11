/**
 * Realtime Sync Helper Functions (Stub)
 * TODO: Implement when realtime sync feature is developed
 */
import type {
  RealtimeUpdate,
  SyncChannel,
  ChannelType,
  RealtimeSyncMetrics,
  Subscription,
  UpdateCallback,
} from "../../types/realtime";

export const createWebSocketUrl = (_userId: string): string => {
  return "";
};

export const createSyncChannel = (
  _type: ChannelType,
  _userId: string,
  _participants: string[],
): SyncChannel => {
  return {} as SyncChannel;
};

export const sendWebSocketMessage = (
  _ws: WebSocket | null,
  _message: RealtimeUpdate | Record<string, unknown>,
  _onSuccess?: () => void,
): void => {
  // Stub implementation
};

export const updateSyncMetrics = (
  metrics: RealtimeSyncMetrics,
  _event: string,
): RealtimeSyncMetrics => {
  // Stub implementation - return metrics unchanged
  return metrics;
};

export const shouldAttemptReconnection = (
  _event: CloseEvent,
  _currentAttempts: number,
  _maxAttempts: number,
): boolean => {
  return false;
};

export const createSubscription = (
  dataType: string,
  callback: UpdateCallback,
): Subscription => {
  return {
    id: Math.random().toString(36).substring(7),
    dataType,
    callback,
    isActive: true,
    created: new Date(),
  };
};

export const notifySubscribers = (): void => {
  // Stub implementation
};
