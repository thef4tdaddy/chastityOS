import { Event } from "../../types/events";
import { DBEvent, EventFilters } from "../../types/database";

/**
 * Event Management Utilities
 * Query keys and helper functions for event hooks
 */

// Utility function to convert Event to DBEvent format
export const eventToDBEvent = (
  event: Event,
): Omit<DBEvent, "lastModified" | "syncStatus"> => {
  return {
    id: event.id,
    userId: event.userId,
    type: event.type,
    timestamp: event.timestamp,
    details: event.details,
    isPrivate: false, // Default value, can be overridden
    sessionId: undefined, // Can be set if available
  };
};

// Query Keys
export const eventKeys = {
  all: ["events"] as const,
  lists: () => [...eventKeys.all, "list"] as const,
  list: (userId: string, filters?: EventFilters) =>
    [...eventKeys.lists(), userId, filters] as const,
  infinite: (userId: string, filters?: EventFilters) =>
    [...eventKeys.all, "infinite", userId, filters] as const,
  detail: (eventId: string) => [...eventKeys.all, "detail", eventId] as const,
  recent: (userId: string, limit?: number) =>
    [...eventKeys.all, "recent", userId, limit] as const,
} as const;
