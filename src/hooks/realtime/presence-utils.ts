/**
 * Presence helper functions
 */
import {
  UserPresence,
  PresenceStatus,
  ActivityContext,
} from "../../types/realtime";

// Helper function to get device type
export function getDeviceType(): "desktop" | "mobile" | "tablet" {
  const userAgent = navigator.userAgent.toLowerCase();

  if (/tablet|ipad|playbook|silk/.test(userAgent)) {
    return "tablet";
  }

  if (
    /mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/.test(
      userAgent,
    )
  ) {
    return "mobile";
  }

  return "desktop";
}

// Helper function to send presence update
export async function sendPresenceUpdate(
  _presence: UserPresence,
): Promise<void> {
  // In real implementation, send to backend/WebSocket

  // Simulate API call
  try {
    // await fetch('/api/presence', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(presence),
    // });
  } catch (_error) {
    // Failed to send presence update
  }
}

// Helper function to fetch user presences
export async function fetchUserPresences(
  userIds: string[],
): Promise<UserPresence[]> {
  // In real implementation, fetch from backend

  // Simulate API response
  return userIds.map((userId) => ({
    userId,
    status: PresenceStatus.OFFLINE,
    lastSeen: new Date(Date.now() - Math.random() * 3600000), // Random time in last hour
  }));
}

// Helper function to create presence update
export function createPresenceUpdate(
  basePresence: UserPresence,
  status: PresenceStatus,
  customMessage?: string,
  currentActivity?: ActivityContext,
  additionalData?: Partial<UserPresence>,
): UserPresence {
  return {
    ...basePresence,
    status,
    lastSeen: new Date(),
    customMessage,
    currentActivity,
    deviceType: getDeviceType(),
    platform: navigator.platform,
    ...additionalData,
  };
}

// Helper function to filter users by status
export function filterUsersByStatus(
  userPresences: Record<string, UserPresence>,
  statuses: PresenceStatus[],
): UserPresence[] {
  return Object.values(userPresences).filter((presence) =>
    statuses.includes(presence.status),
  );
}

// Helper function to count users by status
export function countUsersByStatus(
  userPresences: Record<string, UserPresence>,
  statuses: PresenceStatus[],
): number {
  return filterUsersByStatus(userPresences, statuses).length;
}
