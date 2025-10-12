import {
  useMutation,
  useQuery,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { eventDBService } from "../../services/database/EventDBService";
import { DBEvent, EventFilters, EventType } from "../../types/database";
import { serviceLogger } from "../../utils/logging";
import { eventKeys } from "@/utils/events";
import { firebaseSync } from "@/services/sync";

const logger = serviceLogger("useEvents");

/**
 * Event Management Hooks - TanStack Query Integration
 *
 * Strategy: Dexie-first write, Firebase background sync
 * All hooks return DBEvent type for consistency with database
 */

interface CreateEventParams {
  userId: string;
  type: EventType;
  timestamp?: Date;
  notes?: string;
  duration?: number;
  isPrivate?: boolean;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Get event history for a user with filters
 * Fixes: LogEventPage.tsx:20 (eventDBService.findByUserId)
 */
export function useEventHistory(
  userId: string,
  filters?: EventFilters & { enabled?: boolean },
) {
  const { enabled = true, ...eventFilters } = filters || {};

  return useQuery({
    queryKey: eventKeys.list(userId, eventFilters),
    queryFn: async (): Promise<DBEvent[]> => {
      logger.info("Fetching event history", { userId, filters });

      try {
        const events = await eventDBService.findByUserId(userId);

        // Apply filters
        let filteredEvents = events;

        if (eventFilters?.type) {
          filteredEvents = filteredEvents.filter(
            (event) => event.type === eventFilters.type,
          );
        }

        if (eventFilters?.startDate) {
          filteredEvents = filteredEvents.filter(
            (event) => new Date(event.timestamp) >= eventFilters.startDate!,
          );
        }

        if (eventFilters?.endDate) {
          filteredEvents = filteredEvents.filter(
            (event) => new Date(event.timestamp) <= eventFilters.endDate!,
          );
        }

        // Sort by timestamp (newest first)
        filteredEvents.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );

        if (eventFilters?.limit) {
          filteredEvents = filteredEvents.slice(0, eventFilters.limit);
        }

        logger.info("Event history retrieved", {
          userId,
          totalEvents: events.length,
          filteredEvents: filteredEvents.length,
        });

        return filteredEvents;
      } catch (error) {
        logger.error("Failed to fetch event history", {
          error: error instanceof Error ? error.message : String(error),
          userId,
        });
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - warm data
    gcTime: 30 * 60 * 1000, // 30 minutes garbage collection
    enabled: !!userId && enabled,
  });
}

/**
 * Infinite query for event history with pagination
 * Useful for long event lists with infinite scroll
 */
export function useInfiniteEventHistory(
  userId: string,
  filters?: EventFilters,
  pageSize = 20,
) {
  return useInfiniteQuery({
    queryKey: eventKeys.infinite(userId, filters),
    queryFn: async ({
      pageParam = 0,
    }): Promise<{ events: DBEvent[]; nextPage?: number }> => {
      logger.info("Fetching infinite event page", {
        userId,
        pageParam,
        pageSize,
      });

      const events = await eventDBService.findByUserId(userId);

      // Apply filters and sorting (same as useEventHistory)
      let filteredEvents = events;

      if (filters?.type) {
        filteredEvents = filteredEvents.filter(
          (event) => event.type === filters.type,
        );
      }

      if (filters?.startDate) {
        filteredEvents = filteredEvents.filter(
          (event) => new Date(event.timestamp) >= filters.startDate!,
        );
      }

      if (filters?.endDate) {
        filteredEvents = filteredEvents.filter(
          (event) => new Date(event.timestamp) <= filters.endDate!,
        );
      }

      filteredEvents.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

      // Pagination
      const start = pageParam * pageSize;
      const end = start + pageSize;
      const pageEvents = filteredEvents.slice(start, end);

      const hasMore = end < filteredEvents.length;

      return {
        events: pageEvents,
        nextPage: hasMore ? pageParam + 1 : undefined,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 5 * 60 * 1000,
    enabled: !!userId,
  });
}

/**
 * Get recent events for quick overview
 * Useful for dashboard summaries
 */
export function useRecentEvents(userId: string, limit = 10) {
  return useQuery({
    queryKey: eventKeys.recent(userId, limit),
    queryFn: async (): Promise<DBEvent[]> => {
      logger.info("Fetching recent events", { userId, limit });

      const events = await eventDBService.findByUserId(userId);

      // Sort by timestamp and take most recent
      const recentEvents = events
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )
        .slice(0, limit);

      return recentEvents;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - recent data changes frequently
    enabled: !!userId,
  });
}

/**
 * Get single event by ID
 */
export function useEvent(eventId: string) {
  return useQuery({
    queryKey: eventKeys.detail(eventId),
    queryFn: async (): Promise<DBEvent | null> => {
      logger.info("Fetching event detail", { eventId });
      const event = await eventDBService.findById(eventId);
      return event ?? null;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - historical data is stable
    enabled: !!eventId,
  });
}

/**
 * Create new event with enhanced error handling
 * Strategy: Dexie-first write, Firebase background sync
 */
export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateEventParams): Promise<DBEvent> => {
      logger.info("Creating new event", {
        userId: params.userId,
        eventType: params.type,
        timestamp: params.timestamp,
      });

      // Validate params
      if (!params.userId) {
        const error = new Error("User ID is required to create an event");
        logger.error("Event creation validation failed", {
          error: error.message,
        });
        throw error;
      }

      if (!params.type) {
        const error = new Error("Event type is required");
        logger.error("Event creation validation failed", {
          error: error.message,
        });
        throw error;
      }

      // Prepare event data for database
      const { notes, duration, metadata, ...restParams } = params;
      const eventData: Omit<DBEvent, "id" | "lastModified" | "syncStatus"> = {
        userId: params.userId,
        type: params.type,
        timestamp: params.timestamp || new Date(),
        sessionId: params.sessionId,
        isPrivate: params.isPrivate ?? false,
        details: {
          notes,
          duration,
          metadata,
        },
      };

      try {
        // 1. Write to local Dexie immediately
        const eventId = await eventDBService.createEvent(eventData);

        // 2. Trigger Firebase sync in background (best-effort)
        if (navigator.onLine) {
          firebaseSync.syncUserEvents(params.userId).catch((syncError) => {
            logger.warn("Event creation sync failed (will retry later)", {
              error:
                syncError instanceof Error
                  ? syncError.message
                  : String(syncError),
              eventId,
            });
          });
        } else {
          logger.info(
            "Offline mode: Event will sync when connection is restored",
            {
              eventId,
            },
          );
        }

        logger.info("Event created successfully", {
          eventId,
          userId: params.userId,
          type: params.type,
        });

        // Return the created event with the generated ID
        return {
          id: eventId,
          ...eventData,
          lastModified: new Date(),
          syncStatus: "pending" as const,
        };
      } catch (error) {
        logger.error("Failed to create event in local database", {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          userId: params.userId,
          eventType: params.type,
        });
        throw error;
      }
    },
    retry: 2, // Retry failed mutations up to 2 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
    onSuccess: (data, variables) => {
      // Invalidate list queries to trigger refetch
      queryClient.invalidateQueries({
        queryKey: eventKeys.list(variables.userId),
      });
      queryClient.invalidateQueries({
        queryKey: eventKeys.recent(variables.userId),
      });
      queryClient.invalidateQueries({
        queryKey: eventKeys.infinite(variables.userId),
      });

      logger.info("Event cache invalidated successfully", {
        userId: variables.userId,
        eventId: data.id,
      });
    },
    onError: (error, variables, context) => {
      logger.error("Failed to create event after retries", {
        error: error instanceof Error ? error.message : String(error),
        userId: variables.userId,
        eventType: variables.type,
        attemptsMade: context,
      });
    },
  });
}

/**
 * Update existing event
 */
export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      eventId: string;
      userId: string;
      updates: Partial<DBEvent>;
    }): Promise<void> => {
      logger.info("Updating event", {
        eventId: params.eventId,
        userId: params.userId,
      });

      // 1. Update local Dexie immediately
      await eventDBService.updateEvent(params.eventId, params.updates);

      // 2. Trigger Firebase sync in background
      if (navigator.onLine) {
        firebaseSync.syncUserEvents(params.userId).catch((error) => {
          logger.warn("Event update sync failed", { error });
        });
      }

      logger.info("Event updated successfully", { eventId: params.eventId });
    },
    onSuccess: (data, variables) => {
      // Invalidate list queries
      queryClient.invalidateQueries({
        queryKey: eventKeys.list(variables.userId),
      });
      queryClient.invalidateQueries({
        queryKey: eventKeys.recent(variables.userId),
      });
      queryClient.invalidateQueries({
        queryKey: eventKeys.detail(variables.eventId),
      });
    },
    onError: (error, variables) => {
      logger.error("Failed to update event", {
        error: error instanceof Error ? error.message : String(error),
        eventId: variables.eventId,
      });
    },
  });
}

/**
 * Delete event
 */
export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      eventId: string;
      userId: string;
    }): Promise<string> => {
      logger.info("Deleting event", {
        eventId: params.eventId,
        userId: params.userId,
      });

      // 1. Delete from local Dexie immediately
      await eventDBService.deleteEvent(params.eventId);

      // 2. Trigger Firebase sync in background
      if (navigator.onLine) {
        firebaseSync.syncUserEvents(params.userId).catch((error) => {
          logger.warn("Event deletion sync failed", { error });
        });
      }

      logger.info("Event deleted successfully", { eventId: params.eventId });

      return params.eventId;
    },
    onSuccess: (eventId, variables) => {
      // Invalidate list queries
      queryClient.invalidateQueries({
        queryKey: eventKeys.list(variables.userId),
      });
      queryClient.invalidateQueries({
        queryKey: eventKeys.recent(variables.userId),
      });
      queryClient.removeQueries({ queryKey: eventKeys.detail(eventId) });
    },
    onError: (error, variables) => {
      logger.error("Failed to delete event", {
        error: error instanceof Error ? error.message : String(error),
        eventId: variables.eventId,
      });
    },
  });
}

/**
 * Get event statistics for analytics
 */
export function useEventStats(
  userId: string,
  timeRange?: { start: Date; end: Date },
) {
  return useQuery({
    queryKey: [...eventKeys.all, "stats", userId, timeRange],
    queryFn: async () => {
      logger.info("Calculating event statistics", { userId, timeRange });

      const events = await eventDBService.findByUserId(userId);

      let filteredEvents = events;
      if (timeRange) {
        filteredEvents = events.filter((event) => {
          const eventDate = new Date(event.timestamp);
          return eventDate >= timeRange.start && eventDate <= timeRange.end;
        });
      }

      // Calculate statistics
      const stats = {
        totalEvents: filteredEvents.length,
        eventsByType: {} as Record<string, number>,
        eventsPerDay: {} as Record<string, number>,
        mostRecentEvent:
          filteredEvents.length > 0
            ? filteredEvents.reduce((latest, event) =>
                new Date(event.timestamp) > new Date(latest.timestamp)
                  ? event
                  : latest,
              )
            : null,
      };

      // Count events by type
      filteredEvents.forEach((event) => {
        stats.eventsByType[event.type] =
          (stats.eventsByType[event.type] || 0) + 1;

        const dateKey = new Date(event.timestamp).toDateString();
        stats.eventsPerDay[dateKey] = (stats.eventsPerDay[dateKey] || 0) + 1;
      });

      return stats;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!userId,
  });
}
