/**
 * Realtime Sync Helper Functions (Stub)
 * TODO: Implement when realtime sync feature is developed
 */
import type { RealtimeUpdate, SyncChannel } from "../../types/realtime";

export const createWebSocketUrl = (): string => {
  return "";
};

export const createSyncChannel = (): SyncChannel => {
  return {} as SyncChannel;
};

export const sendWebSocketMessage = (
  _ws: WebSocket | null,
  _message: RealtimeUpdate | Record<string, unknown>,
  _onSuccess?: () => void,
): void => {
  // Stub implementation
};

export const updateSyncMetrics = (): void => {
  // Stub implementation
};

export const shouldAttemptReconnection = (): boolean => {
  return false;
};

export const createSubscription = (): unknown => {
  return {};
};

export const notifySubscribers = (): void => {
  // Stub implementation
};
