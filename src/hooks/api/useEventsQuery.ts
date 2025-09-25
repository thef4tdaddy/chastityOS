/**
 * Events TanStack Query Hooks
 * Manages event log data with Dexie as backend
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { eventDBService } from "@/services/database";
import { cacheConfig } from "@/services/cache-config";
import { firebaseSync } from "@/services/sync";
import type { DBEvent, EventType } from "@/types/database";

/**
 * Query for getting all events for a user
 */
export function useEventsQuery(userId: string | undefined) {
  return useQuery({
    queryKey: ["events", "user", userId],
    queryFn: async () => {
      if (!userId) return [];

      // Always read from local Dexie first for instant response
      const events = await eventDBService.findByUserId(userId);

      // Trigger background sync if online to ensure data freshness
      if (navigator.onLine) {
        firebaseSync.syncUserEvents(userId).catch((error) => {
          console.warn("Background events sync failed:", error);
        });
      }

      return events;
    },
    ...cacheConfig.events, // Apply specific cache settings
    enabled: !!userId, // Only run when userId is available
  });
}

/**
 * Query for getting recent events (last 30 days)
 */
export function useRecentEventsQuery(
  userId: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: ["events", "recent", userId],
    queryFn: async () => {
      if (!userId) return [];

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const allEvents = await eventDBService.findByUserId(userId);
      return allEvents
        .filter((event) => event.timestamp >= thirtyDaysAgo)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    },
    ...cacheConfig.events,
    enabled: !!userId && enabled,
  });
}

/**
 * Query for getting events by type
 */
export function useEventsByTypeQuery(
  userId: string | undefined,
  eventType: EventType,
  enabled = true,
) {
  return useQuery({
    queryKey: ["events", "type", userId, eventType],
    queryFn: async () => {
      if (!userId) return [];

      const allEvents = await eventDBService.findByUserId(userId);
      return allEvents.filter((event) => event.type === eventType);
    },
    ...cacheConfig.events,
    enabled: !!userId && enabled,
  });
}

/**
 * Mutations for event operations
 */
export function useEventMutations() {
  const queryClient = useQueryClient();

  const createEvent = useMutation({
    mutationFn: async (params: {
      userId: string;
      type: EventType;
      timestamp: Date;
      notes?: string;
      duration?: number;
      isPrivate?: boolean;
      sessionId?: string;
      metadata?: Record<string, any>;
    }) => {
      // 1. Write to local Dexie immediately for optimistic update
      const event = await eventDBService.createEvent(params);

      // 2. Trigger Firebase sync in background
      if (navigator.onLine) {
        firebaseSync.syncUserEvents(params.userId).catch((error) => {
          console.warn("Event creation sync failed:", error);
        });
      }

      return event;
    },
    onSuccess: (data, variables) => {
      // Add event to the cache
      queryClient.setQueryData(
        ["events", "user", variables.userId],
        (oldEvents: DBEvent[] | undefined) => {
          if (!oldEvents) return [data];
          return [data, ...oldEvents].sort(
            (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
          );
        },
      );

      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ["events", "recent", variables.userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["events", "type", variables.userId],
      });
    },
    onError: (error) => {
      console.error("Failed to create event:", error);
    },
  });

  const updateEvent = useMutation({
    mutationFn: async (params: {
      eventId: string;
      userId: string;
      updates: Partial<DBEvent>;
    }) => {
      // 1. Update local Dexie immediately
      const updatedEvent = await eventDBService.updateEvent(
        params.eventId,
        params.updates,
      );

      // 2. Trigger Firebase sync in background
      if (navigator.onLine) {
        firebaseSync.syncUserEvents(params.userId).catch((error) => {
          console.warn("Event update sync failed:", error);
        });
      }

      return updatedEvent;
    },
    onSuccess: (data, variables) => {
      // Update event in cache
      queryClient.setQueryData(
        ["events", "user", variables.userId],
        (oldEvents: DBEvent[] | undefined) => {
          if (!oldEvents) return oldEvents;
          return oldEvents.map((event) =>
            event.id === variables.eventId ? { ...event, ...data } : event,
          );
        },
      );

      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ["events", "recent", variables.userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["events", "type", variables.userId],
      });
    },
    onError: (error) => {
      console.error("Failed to update event:", error);
    },
  });

  const deleteEvent = useMutation({
    mutationFn: async (params: { eventId: string; userId: string }) => {
      // 1. Delete from local Dexie immediately
      await eventDBService.deleteEvent(params.eventId);

      // 2. Trigger Firebase sync in background
      if (navigator.onLine) {
        firebaseSync.syncUserEvents(params.userId).catch((error) => {
          console.warn("Event deletion sync failed:", error);
        });
      }

      return params.eventId;
    },
    onSuccess: (eventId, variables) => {
      // Remove event from cache
      queryClient.setQueryData(
        ["events", "user", variables.userId],
        (oldEvents: DBEvent[] | undefined) => {
          if (!oldEvents) return oldEvents;
          return oldEvents.filter((event) => event.id !== eventId);
        },
      );

      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ["events", "recent", variables.userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["events", "type", variables.userId],
      });
    },
    onError: (error) => {
      console.error("Failed to delete event:", error);
    },
  });

  const bulkCreateEvents = useMutation({
    mutationFn: async (params: {
      userId: string;
      events: Array<{
        type: EventType;
        timestamp: Date;
        notes?: string;
        duration?: number;
        isPrivate?: boolean;
        sessionId?: string;
        metadata?: Record<string, any>;
      }>;
    }) => {
      // 1. Create all events in local Dexie
      const createdEvents = await Promise.all(
        params.events.map((eventData) =>
          eventDBService.createEvent({
            ...eventData,
            userId: params.userId,
          }),
        ),
      );

      // 2. Trigger Firebase sync in background
      if (navigator.onLine) {
        firebaseSync.syncUserEvents(params.userId).catch((error) => {
          console.warn("Bulk event creation sync failed:", error);
        });
      }

      return createdEvents;
    },
    onSuccess: (data, variables) => {
      // Add all events to cache
      queryClient.setQueryData(
        ["events", "user", variables.userId],
        (oldEvents: DBEvent[] | undefined) => {
          if (!oldEvents) return data;
          return [...data, ...oldEvents].sort(
            (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
          );
        },
      );

      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ["events", "recent", variables.userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["events", "type", variables.userId],
      });
    },
    onError: (error) => {
      console.error("Failed to bulk create events:", error);
    },
  });

  return {
    createEvent,
    updateEvent,
    deleteEvent,
    bulkCreateEvents,
  };
}
