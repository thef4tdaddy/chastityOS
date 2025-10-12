/**
 * useEvents Tests
 * Tests for event management React Query hooks
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useEventHistory,
  useRecentEvents,
  useCreateEvent,
  useDeleteEvent,
} from "../useEvents";
import { eventDBService } from "../../../services/database/EventDBService";
import type { DBEvent } from "@/types/database";
import type { ReactNode } from "react";

// Mock the eventDBService
vi.mock("../../../services/database/EventDBService", () => ({
  eventDBService: {
    findByUserId: vi.fn(),
    findById: vi.fn(),
    createEvent: vi.fn(),
    updateEvent: vi.fn(),
    deleteEvent: vi.fn(),
  },
}));

// Mock the logger
vi.mock("../../../utils/logging", () => ({
  serviceLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  }),
}));

// Mock firebaseSync
vi.mock("../../../services/sync", () => ({
  firebaseSync: {
    syncUserEvents: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock eventKeys
vi.mock("../../../utils/events", () => ({
  eventKeys: {
    all: ["events"],
    list: (userId: string, filters?: unknown) => [
      "events",
      "list",
      userId,
      filters,
    ],
    recent: (userId: string, limit?: number) => [
      "events",
      "recent",
      userId,
      limit,
    ],
    detail: (eventId: string) => ["events", "detail", eventId],
    infinite: (userId: string, filters?: unknown) => [
      "events",
      "infinite",
      userId,
      filters,
    ],
  },
}));

describe("useEvents hooks", () => {
  let queryClient: QueryClient;

  const mockUserId = "test-user-123";
  const mockEvents: DBEvent[] = [
    {
      id: "event-1",
      userId: mockUserId,
      type: "SESSION_START",
      timestamp: new Date("2024-01-01T10:00:00Z"),
      details: { notes: "Test event 1" },
      syncStatus: "synced",
      lastModified: new Date(),
      isPrivate: false,
    },
    {
      id: "event-2",
      userId: mockUserId,
      type: "TASK_COMPLETED",
      timestamp: new Date("2024-01-02T10:00:00Z"),
      details: { notes: "Test event 2" },
      syncStatus: "synced",
      lastModified: new Date(),
      isPrivate: false,
    },
    {
      id: "event-3",
      userId: mockUserId,
      type: "SESSION_END",
      timestamp: new Date("2024-01-03T10:00:00Z"),
      details: { notes: "Test event 3" },
      syncStatus: "synced",
      lastModified: new Date(),
      isPrivate: false,
    },
  ];

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    return ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient?.clear();
  });

  describe("useEventHistory", () => {
    it("should fetch event history for a user", async () => {
      vi.mocked(eventDBService.findByUserId).mockResolvedValue(mockEvents);

      const { result } = renderHook(() => useEventHistory(mockUserId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(3);
      expect(eventDBService.findByUserId).toHaveBeenCalledWith(mockUserId);
    });

    it("should sort events by timestamp descending", async () => {
      vi.mocked(eventDBService.findByUserId).mockResolvedValue(mockEvents);

      const { result } = renderHook(() => useEventHistory(mockUserId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const events = result.current.data!;
      expect(events[0].id).toBe("event-3"); // Most recent first
      expect(events[2].id).toBe("event-1"); // Oldest last
    });

    it("should filter events by type", async () => {
      vi.mocked(eventDBService.findByUserId).mockResolvedValue(mockEvents);

      const { result } = renderHook(
        () => useEventHistory(mockUserId, { type: "SESSION_START" }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(1);
      expect(result.current.data![0].type).toBe("SESSION_START");
    });

    it("should filter events by date range", async () => {
      vi.mocked(eventDBService.findByUserId).mockResolvedValue(mockEvents);

      const { result } = renderHook(
        () =>
          useEventHistory(mockUserId, {
            startDate: new Date("2024-01-02T00:00:00Z"),
            endDate: new Date("2024-01-03T23:59:59Z"),
          }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data!.map((e) => e.id)).toEqual([
        "event-3",
        "event-2",
      ]);
    });

    it("should apply limit to results", async () => {
      vi.mocked(eventDBService.findByUserId).mockResolvedValue(mockEvents);

      const { result } = renderHook(
        () => useEventHistory(mockUserId, { limit: 2 }),
        { wrapper: createWrapper() },
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(2);
    });

    it("should not fetch when userId is not provided", () => {
      vi.mocked(eventDBService.findByUserId).mockResolvedValue(mockEvents);

      const { result } = renderHook(() => useEventHistory(""), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(eventDBService.findByUserId).not.toHaveBeenCalled();
    });

    it("should handle enabled flag", () => {
      vi.mocked(eventDBService.findByUserId).mockResolvedValue(mockEvents);

      const { result } = renderHook(
        () => useEventHistory(mockUserId, { enabled: false }),
        { wrapper: createWrapper() },
      );

      expect(result.current.isFetching).toBe(false);
      expect(eventDBService.findByUserId).not.toHaveBeenCalled();
    });

    it("should handle errors", async () => {
      const error = new Error("Database error");
      vi.mocked(eventDBService.findByUserId).mockRejectedValue(error);

      const { result } = renderHook(() => useEventHistory(mockUserId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBe(error);
    });
  });

  describe("useRecentEvents", () => {
    it("should fetch recent events", async () => {
      vi.mocked(eventDBService.findByUserId).mockResolvedValue(mockEvents);

      const { result } = renderHook(() => useRecentEvents(mockUserId, 2), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data![0].id).toBe("event-3"); // Most recent
    });

    it("should default to 10 events when limit not specified", async () => {
      const manyEvents = Array.from({ length: 15 }, (_, i) => ({
        ...mockEvents[0],
        id: `event-${i}`,
        timestamp: new Date(2024, 0, i + 1),
      }));

      vi.mocked(eventDBService.findByUserId).mockResolvedValue(manyEvents);

      const { result } = renderHook(() => useRecentEvents(mockUserId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(10);
    });
  });

  describe("useCreateEvent", () => {
    it("should create a new event", async () => {
      const eventId = "new-event-id";
      vi.mocked(eventDBService.createEvent).mockResolvedValue(eventId);

      const { result } = renderHook(() => useCreateEvent(), {
        wrapper: createWrapper(),
      });

      const newEvent = {
        userId: mockUserId,
        type: "SESSION_START" as const,
        timestamp: new Date("2024-01-04T10:00:00Z"),
        notes: "New event",
      };

      await result.current.mutateAsync(newEvent);

      expect(eventDBService.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          type: "SESSION_START",
          details: expect.objectContaining({
            notes: "New event",
          }),
        }),
      );
    });

    it("should set isPrivate to false by default", async () => {
      const eventId = "new-event-id";
      vi.mocked(eventDBService.createEvent).mockResolvedValue(eventId);

      const { result } = renderHook(() => useCreateEvent(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        userId: mockUserId,
        type: "SESSION_START",
      });

      expect(eventDBService.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          isPrivate: false,
        }),
      );
    });

    it("should handle errors during creation", async () => {
      const error = new Error("Creation failed");
      vi.mocked(eventDBService.createEvent).mockRejectedValue(error);

      const { result } = renderHook(() => useCreateEvent(), {
        wrapper: createWrapper(),
      });

      await expect(
        result.current.mutateAsync({
          userId: mockUserId,
          type: "SESSION_START",
        }),
      ).rejects.toThrow("Creation failed");
    });
  });

  describe("useDeleteEvent", () => {
    it("should delete an event", async () => {
      vi.mocked(eventDBService.deleteEvent).mockResolvedValue();

      const { result } = renderHook(() => useDeleteEvent(), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        eventId: "event-1",
        userId: mockUserId,
      });

      expect(eventDBService.deleteEvent).toHaveBeenCalledWith("event-1");
    });

    it("should handle errors during deletion", async () => {
      const error = new Error("Deletion failed");
      vi.mocked(eventDBService.deleteEvent).mockRejectedValue(error);

      const { result } = renderHook(() => useDeleteEvent(), {
        wrapper: createWrapper(),
      });

      await expect(
        result.current.mutateAsync({
          eventId: "event-1",
          userId: mockUserId,
        }),
      ).rejects.toThrow("Deletion failed");
    });
  });
});
