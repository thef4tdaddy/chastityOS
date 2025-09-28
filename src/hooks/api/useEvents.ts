import {
  useMutation,
  useQuery,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { eventDBService } from "../../services/database/EventDBService";
import { DBEvent, EventFilters } from "../../types/database";
import { Event, EventType } from "../../types/events";
import { logger } from "../../utils/logging";

/**
 * Event Management Hooks - TanStack Query Integration
 *
 * Integrates with:
 * - eventDBService → Dexie → Firebase sync
 * - LogEventPage.tsx, LogEventForm.tsx (critical fixes needed)
 *
 * Fixes:
 * - LogEventForm.tsx:92-93 (commented eventDBService.create)
 * - LogEventPage.tsx:20 (eventDBService.findByUserId)
 *
 * Strategy: Dexie-first write, Firebase background sync
 */

// Utility function to convert Event to DBEvent format
const eventToDBEvent = (
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

// Types
interface EventFilters {
  type?: EventType;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

interface CreateEventData {
  type: EventType;
  details: Record<string, any>;
  timestamp?: Date;
}

interface UpdateEventData {
  type?: EventType;
  details?: Record<string, any>;
  timestamp?: Date;
}

/**
 * Get event history for a user with filters
 * Fixes: LogEventPage.tsx:20 (eventDBService.findByUserId)
 */
export function useEventHistory(userId: string, filters?: EventFilters) {
  return useQuery({
    queryKey: eventKeys.list(userId, filters),
    queryFn: async (): Promise<DBEvent[]> => {
      logger.info("Fetching event history", { userId, filters });

      try {
        const events = await eventDBService.findByUserId(userId);

        // Apply filters
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

        // Sort by timestamp (newest first)
        filteredEvents.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );

        if (filters?.limit) {
          filteredEvents = filteredEvents.slice(0, filters.limit);
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
    enabled: !!userId,
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
 * Create new event
 * Fixes: LogEventForm.tsx:92-93 (commented eventDBService.create)
 * Strategy: Dexie-first write, Firebase background sync
 */
export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      eventData,
    }: {
      userId: string;
      eventData: CreateEventData;
    }): Promise<Event> => {
      logger.info("Creating new event", { userId, eventType: eventData.type });

      // Generate event ID
      const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const newEvent: DBEvent = {
        id: eventId,
        userId,
        syncStatus: "pending",
        lastModified: new Date(),
        type: eventData.type,
        timestamp: eventData.timestamp || new Date(),
        details: eventData.details || {},
        isPrivate: eventData.isPrivate || false,
      };

      // Dexie-first write for immediate UI response
      const dbEvent = eventToDBEvent(newEvent);
      await eventDBService.create(dbEvent);

      logger.info("Event created successfully", {
        eventId,
        userId,
        type: eventData.type,
      });

      return newEvent;
    },
    onSuccess: (newEvent, { userId }) => {
      logger.info("Event creation successful", {
        eventId: newEvent.id,
        userId,
      });

      // Invalidate relevant queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      queryClient.invalidateQueries({ queryKey: eventKeys.recent(userId) });
      queryClient.invalidateQueries({ queryKey: eventKeys.infinite(userId) });

      // Optimistically add to cache if we have existing data
      queryClient.setQueriesData(
        { queryKey: eventKeys.list(userId) },
        (oldData: Event[] | undefined) => {
          if (!oldData) return undefined;
          return [newEvent, ...oldData];
        },
      );
    },
    onError: (error, { userId, eventData }) => {
      logger.error("Event creation failed", {
        error: error instanceof Error ? error.message : String(error),
        userId,
        eventType: eventData.type,
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
    mutationFn: async ({
      eventId,
      userId,
      updates,
    }: {
      eventId: string;
      userId: string;
      updates: UpdateEventData;
    }): Promise<DBEvent> => {
      logger.info("Updating event", { eventId, userId });

      const existingEvent = await eventDBService.findById(eventId);
      if (!existingEvent) {
        throw new Error(`Event not found: ${eventId}`);
      }

      const updatedEvent: DBEvent = {
        ...existingEvent,
        ...updates,
        createdAt: existingEvent.createdAt || new Date(),
        lastModified: new Date(),
        updatedAt: new Date(),
      };

      const dbUpdatedEvent = eventToDBEvent(updatedEvent);
      await eventDBService.update(eventId, dbUpdatedEvent);

      logger.info("Event updated successfully", { eventId, userId });

      return updatedEvent;
    },
    onSuccess: (updatedEvent, { userId, eventId }) => {
      logger.info("Event update successful", { eventId, userId });

      // Update detail cache
      queryClient.setQueryData(eventKeys.detail(eventId), updatedEvent);

      // Invalidate list queries to reflect changes
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      queryClient.invalidateQueries({ queryKey: eventKeys.recent(userId) });
    },
    onError: (error, { eventId, userId }) => {
      logger.error("Event update failed", {
        error: error instanceof Error ? error.message : String(error),
        eventId,
        userId,
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
    mutationFn: async ({
      eventId,
      userId,
    }: {
      eventId: string;
      userId: string;
    }): Promise<void> => {
      logger.info("Deleting event", { eventId, userId });

      await eventDBService.delete(eventId);

      logger.info("Event deleted successfully", { eventId, userId });
    },
    onSuccess: (_, { eventId, userId }) => {
      logger.info("Event deletion successful", { eventId, userId });

      // Remove from detail cache
      queryClient.removeQueries({ queryKey: eventKeys.detail(eventId) });

      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      queryClient.invalidateQueries({ queryKey: eventKeys.recent(userId) });
      queryClient.invalidateQueries({ queryKey: eventKeys.infinite(userId) });

      // Optimistically remove from cached lists
      queryClient.setQueriesData(
        { queryKey: eventKeys.list(userId) },
        (oldData: Event[] | undefined) => {
          if (!oldData) return undefined;
          return oldData.filter((event) => event.id !== eventId);
        },
      );
    },
    onError: (error, { eventId, userId }) => {
      logger.error("Event deletion failed", {
        error: error instanceof Error ? error.message : String(error),
        eventId,
        userId,
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
