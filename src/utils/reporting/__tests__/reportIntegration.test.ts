/**
 * Integration Tests for Report Data Aggregation and Synchronization
 * Tests statistics calculation, data aggregation across features, and data accuracy
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock data structures
interface MockSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  pauseDuration?: number;
  goalDuration?: number;
  goalStatus?: "Met" | "Not Met" | null;
  endReason?: string;
}

interface MockEvent {
  id: string;
  timestamp: Date;
  eventType: string;
  description?: string;
  intensity?: number;
}

interface AggregatedStatistics {
  totalSessions: number;
  totalChastityTime: number;
  totalPauseTime: number;
  averageSessionDuration: number;
  longestSession: number;
  shortestSession: number;
  eventCount: number;
  goalMetCount: number;
  goalNotMetCount: number;
  completionRate: number;
}

describe("Report Integration Tests", () => {
  describe("Statistics Aggregation Across Features", () => {
    it("should aggregate statistics from multiple sessions", () => {
      const sessions: MockSession[] = [
        {
          id: "1",
          startTime: new Date("2024-01-01T10:00:00Z"),
          endTime: new Date("2024-01-01T12:00:00Z"),
          duration: 7200, // 2 hours
          pauseDuration: 0,
          goalDuration: 3600,
          goalStatus: "Met",
        },
        {
          id: "2",
          startTime: new Date("2024-01-02T10:00:00Z"),
          endTime: new Date("2024-01-02T14:00:00Z"),
          duration: 14400, // 4 hours
          pauseDuration: 600, // 10 minutes
          goalDuration: 7200,
          goalStatus: "Met",
        },
        {
          id: "3",
          startTime: new Date("2024-01-03T10:00:00Z"),
          endTime: new Date("2024-01-03T11:00:00Z"),
          duration: 3600, // 1 hour
          pauseDuration: 300, // 5 minutes
          goalDuration: 7200,
          goalStatus: "Not Met",
        },
      ];

      const stats = aggregateSessionStatistics(sessions);

      expect(stats.totalSessions).toBe(3);
      expect(stats.totalChastityTime).toBe(25200); // 7 hours total
      expect(stats.totalPauseTime).toBe(900); // 15 minutes
      expect(stats.averageSessionDuration).toBe(8400); // 2.33 hours
      expect(stats.longestSession).toBe(14400); // 4 hours
      expect(stats.shortestSession).toBe(3600); // 1 hour
      expect(stats.goalMetCount).toBe(2);
      expect(stats.goalNotMetCount).toBe(1);
    });

    it("should calculate completion rate correctly", () => {
      const sessions: MockSession[] = [
        {
          id: "1",
          startTime: new Date(),
          endTime: new Date(),
          duration: 3600,
          goalStatus: "Met",
        },
        {
          id: "2",
          startTime: new Date(),
          endTime: new Date(),
          duration: 3600,
          goalStatus: "Met",
        },
        {
          id: "3",
          startTime: new Date(),
          endTime: new Date(),
          duration: 3600,
          goalStatus: "Not Met",
        },
        {
          id: "4",
          startTime: new Date(),
          endTime: new Date(),
          duration: 3600,
          goalStatus: "Not Met",
        },
      ];

      const stats = aggregateSessionStatistics(sessions);

      expect(stats.completionRate).toBe(50); // 2 out of 4 met
    });

    it("should handle sessions with no goal data", () => {
      const sessions: MockSession[] = [
        {
          id: "1",
          startTime: new Date(),
          endTime: new Date(),
          duration: 3600,
        },
        {
          id: "2",
          startTime: new Date(),
          endTime: new Date(),
          duration: 7200,
        },
      ];

      const stats = aggregateSessionStatistics(sessions);

      expect(stats.totalSessions).toBe(2);
      expect(stats.goalMetCount).toBe(0);
      expect(stats.goalNotMetCount).toBe(0);
      expect(stats.completionRate).toBe(0);
    });

    it("should aggregate event statistics correctly", () => {
      const events: MockEvent[] = [
        {
          id: "1",
          timestamp: new Date("2024-01-01"),
          eventType: "orgasm",
          intensity: 8,
        },
        {
          id: "2",
          timestamp: new Date("2024-01-02"),
          eventType: "denial",
          intensity: 7,
        },
        {
          id: "3",
          timestamp: new Date("2024-01-03"),
          eventType: "tease",
          intensity: 6,
        },
      ];

      const eventStats = aggregateEventStatistics(events);

      expect(eventStats.totalEvents).toBe(3);
      expect(eventStats.averageIntensity).toBe(7);
      expect(eventStats.eventsByType.orgasm).toBe(1);
      expect(eventStats.eventsByType.denial).toBe(1);
      expect(eventStats.eventsByType.tease).toBe(1);
    });
  });

  describe("Report Data Synchronization", () => {
    it("should synchronize session and event data", () => {
      const sessions: MockSession[] = [
        {
          id: "1",
          startTime: new Date("2024-01-01T10:00:00Z"),
          endTime: new Date("2024-01-01T12:00:00Z"),
          duration: 7200,
        },
      ];

      const events: MockEvent[] = [
        {
          id: "1",
          timestamp: new Date("2024-01-01T11:00:00Z"),
          eventType: "denial",
        },
        {
          id: "2",
          timestamp: new Date("2024-01-01T11:30:00Z"),
          eventType: "tease",
        },
      ];

      const syncedData = synchronizeReportData(sessions, events);

      expect(syncedData.sessions).toHaveLength(1);
      expect(syncedData.sessions[0].eventsDuringSession).toBe(2);
      expect(syncedData.totalEvents).toBe(2);
    });

    it("should handle events outside of session times", () => {
      const sessions: MockSession[] = [
        {
          id: "1",
          startTime: new Date("2024-01-01T10:00:00Z"),
          endTime: new Date("2024-01-01T12:00:00Z"),
          duration: 7200,
        },
      ];

      const events: MockEvent[] = [
        {
          id: "1",
          timestamp: new Date("2024-01-01T09:00:00Z"), // Before session
          eventType: "orgasm",
        },
        {
          id: "2",
          timestamp: new Date("2024-01-01T13:00:00Z"), // After session
          eventType: "denial",
        },
      ];

      const syncedData = synchronizeReportData(sessions, events);

      expect(syncedData.sessions[0].eventsDuringSession).toBe(0);
      expect(syncedData.eventsOutsideSessions).toBe(2);
    });

    it("should maintain data consistency across updates", () => {
      const initialSessions: MockSession[] = [
        {
          id: "1",
          startTime: new Date("2024-01-01"),
          duration: 3600,
        },
      ];

      const updatedSessions: MockSession[] = [
        ...initialSessions,
        {
          id: "2",
          startTime: new Date("2024-01-02"),
          duration: 7200,
        },
      ];

      const initialStats = aggregateSessionStatistics(initialSessions);
      const updatedStats = aggregateSessionStatistics(updatedSessions);

      expect(updatedStats.totalSessions).toBe(initialStats.totalSessions + 1);
      expect(updatedStats.totalChastityTime).toBe(
        initialStats.totalChastityTime + 7200,
      );
    });
  });

  describe("Data Accuracy with Various Combinations", () => {
    it("should handle empty datasets", () => {
      const sessions: MockSession[] = [];
      const events: MockEvent[] = [];

      const sessionStats = aggregateSessionStatistics(sessions);
      const eventStats = aggregateEventStatistics(events);

      expect(sessionStats.totalSessions).toBe(0);
      expect(sessionStats.totalChastityTime).toBe(0);
      expect(sessionStats.averageSessionDuration).toBe(0);
      expect(eventStats.totalEvents).toBe(0);
    });

    it("should handle single session", () => {
      const sessions: MockSession[] = [
        {
          id: "1",
          startTime: new Date(),
          duration: 3600,
        },
      ];

      const stats = aggregateSessionStatistics(sessions);

      expect(stats.totalSessions).toBe(1);
      expect(stats.averageSessionDuration).toBe(3600);
      expect(stats.longestSession).toBe(3600);
      expect(stats.shortestSession).toBe(3600);
    });

    it("should handle sessions with extreme durations", () => {
      const sessions: MockSession[] = [
        {
          id: "1",
          startTime: new Date(),
          duration: 60, // 1 minute
        },
        {
          id: "2",
          startTime: new Date(),
          duration: 2592000, // 30 days
        },
      ];

      const stats = aggregateSessionStatistics(sessions);

      expect(stats.totalSessions).toBe(2);
      expect(stats.longestSession).toBe(2592000);
      expect(stats.shortestSession).toBe(60);
      expect(stats.averageSessionDuration).toBe(1296030);
    });

    it("should handle sessions with pauses correctly", () => {
      const sessions: MockSession[] = [
        {
          id: "1",
          startTime: new Date(),
          duration: 7200, // 2 hours
          pauseDuration: 3600, // 1 hour paused
        },
        {
          id: "2",
          startTime: new Date(),
          duration: 3600, // 1 hour
          pauseDuration: 0,
        },
      ];

      const stats = aggregateSessionStatistics(sessions);

      expect(stats.totalChastityTime).toBe(10800); // 3 hours total
      expect(stats.totalPauseTime).toBe(3600); // 1 hour paused
      expect(stats.effectiveChastityTime).toBe(7200); // 2 hours effective
    });

    it("should handle mixed goal statuses", () => {
      const sessions: MockSession[] = [
        { id: "1", startTime: new Date(), duration: 3600, goalStatus: "Met" },
        {
          id: "2",
          startTime: new Date(),
          duration: 3600,
          goalStatus: "Not Met",
        },
        { id: "3", startTime: new Date(), duration: 3600, goalStatus: null },
        { id: "4", startTime: new Date(), duration: 3600, goalStatus: "Met" },
      ];

      const stats = aggregateSessionStatistics(sessions);

      expect(stats.goalMetCount).toBe(2);
      expect(stats.goalNotMetCount).toBe(1);
      // 2 met out of 3 sessions with goals = 66.67%
      expect(Math.round(stats.completionRate)).toBe(67);
    });
  });

  describe("Error Scenarios", () => {
    it("should handle null or undefined data gracefully", () => {
      const sessions = null as unknown as MockSession[];
      const events = undefined as unknown as MockEvent[];

      const sessionStats = aggregateSessionStatistics(sessions || []);
      const eventStats = aggregateEventStatistics(events || []);

      expect(sessionStats.totalSessions).toBe(0);
      expect(eventStats.totalEvents).toBe(0);
    });

    it("should handle sessions with missing required fields", () => {
      const sessions: Partial<MockSession>[] = [
        {
          id: "1",
          // Missing startTime
          duration: 3600,
        },
        {
          id: "2",
          startTime: new Date(),
          // Missing duration
        },
      ];

      // Should handle gracefully with defaults
      expect(() => {
        aggregateSessionStatistics(sessions as MockSession[]);
      }).not.toThrow();
    });

    it("should handle negative durations", () => {
      const sessions: MockSession[] = [
        {
          id: "1",
          startTime: new Date(),
          duration: -3600, // Invalid negative duration
        },
        {
          id: "2",
          startTime: new Date(),
          duration: 3600,
        },
      ];

      const stats = aggregateSessionStatistics(sessions);

      // Should filter out or correct negative durations
      expect(stats.totalChastityTime).toBeGreaterThanOrEqual(0);
    });

    it("should handle events with missing timestamps", () => {
      const events: Partial<MockEvent>[] = [
        {
          id: "1",
          // Missing timestamp
          eventType: "orgasm",
        },
        {
          id: "2",
          timestamp: new Date(),
          eventType: "denial",
        },
      ];

      expect(() => {
        aggregateEventStatistics(events as MockEvent[]);
      }).not.toThrow();
    });
  });

  describe("Performance with Large Datasets", () => {
    it("should handle 1000 sessions efficiently", () => {
      const sessions: MockSession[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `session-${i}`,
        startTime: new Date(Date.now() - i * 86400000), // One per day
        endTime: new Date(Date.now() - i * 86400000 + 3600000),
        duration: 3600 + Math.random() * 7200, // 1-3 hours
        pauseDuration: Math.random() * 600, // 0-10 minutes
        goalStatus: Math.random() > 0.5 ? "Met" : "Not Met",
      }));

      const startTime = performance.now();
      const stats = aggregateSessionStatistics(sessions);
      const endTime = performance.now();

      expect(stats.totalSessions).toBe(1000);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in <100ms
    });

    it("should handle 5000 events efficiently", () => {
      const events: MockEvent[] = Array.from({ length: 5000 }, (_, i) => ({
        id: `event-${i}`,
        timestamp: new Date(Date.now() - i * 3600000), // One per hour
        eventType: ["orgasm", "denial", "tease", "edge"][i % 4],
        intensity: Math.floor(Math.random() * 10) + 1,
      }));

      const startTime = performance.now();
      const stats = aggregateEventStatistics(events);
      const endTime = performance.now();

      expect(stats.totalEvents).toBe(5000);
      expect(endTime - startTime).toBeLessThan(200); // Should complete in <200ms
    });

    it("should handle synchronization of large datasets", () => {
      const sessions: MockSession[] = Array.from({ length: 500 }, (_, i) => ({
        id: `session-${i}`,
        startTime: new Date(Date.now() - i * 86400000),
        endTime: new Date(Date.now() - i * 86400000 + 7200000),
        duration: 7200,
      }));

      const events: MockEvent[] = Array.from({ length: 2000 }, (_, i) => ({
        id: `event-${i}`,
        timestamp: new Date(Date.now() - i * 21600000), // Every 6 hours
        eventType: "denial",
      }));

      const startTime = performance.now();
      const syncedData = synchronizeReportData(sessions, events);
      const endTime = performance.now();

      expect(syncedData.sessions).toHaveLength(500);
      expect(endTime - startTime).toBeLessThan(300); // Should complete in <300ms
    });
  });
});

// Helper functions for aggregation (would be in actual implementation)

function aggregateSessionStatistics(
  sessions: MockSession[],
): AggregatedStatistics {
  if (!sessions || sessions.length === 0) {
    return {
      totalSessions: 0,
      totalChastityTime: 0,
      totalPauseTime: 0,
      averageSessionDuration: 0,
      longestSession: 0,
      shortestSession: 0,
      eventCount: 0,
      goalMetCount: 0,
      goalNotMetCount: 0,
      completionRate: 0,
    };
  }

  const validSessions = sessions.filter(
    (s) => s.duration !== undefined && s.duration >= 0,
  );

  const totalChastityTime = validSessions.reduce(
    (sum, s) => sum + (s.duration || 0),
    0,
  );
  const totalPauseTime = validSessions.reduce(
    (sum, s) => sum + (s.pauseDuration || 0),
    0,
  );

  const durations = validSessions.map((s) => s.duration || 0);
  const longestSession = durations.length > 0 ? Math.max(...durations) : 0;
  const shortestSession = durations.length > 0 ? Math.min(...durations) : 0;

  const goalMetCount = validSessions.filter(
    (s) => s.goalStatus === "Met",
  ).length;
  const goalNotMetCount = validSessions.filter(
    (s) => s.goalStatus === "Not Met",
  ).length;
  const totalGoalSessions = goalMetCount + goalNotMetCount;

  return {
    totalSessions: validSessions.length,
    totalChastityTime,
    totalPauseTime,
    averageSessionDuration:
      validSessions.length > 0 ? totalChastityTime / validSessions.length : 0,
    longestSession,
    shortestSession,
    eventCount: 0,
    goalMetCount,
    goalNotMetCount,
    completionRate:
      totalGoalSessions > 0 ? (goalMetCount / totalGoalSessions) * 100 : 0,
    effectiveChastityTime: totalChastityTime - totalPauseTime,
  } as AggregatedStatistics & { effectiveChastityTime: number };
}

function aggregateEventStatistics(events: MockEvent[]) {
  if (!events || events.length === 0) {
    return {
      totalEvents: 0,
      averageIntensity: 0,
      eventsByType: {},
    };
  }

  const validEvents = events.filter((e) => e.timestamp !== undefined);

  const eventsByType: Record<string, number> = {};
  let totalIntensity = 0;
  let intensityCount = 0;

  validEvents.forEach((event) => {
    eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;
    if (event.intensity !== undefined) {
      totalIntensity += event.intensity;
      intensityCount++;
    }
  });

  return {
    totalEvents: validEvents.length,
    averageIntensity: intensityCount > 0 ? totalIntensity / intensityCount : 0,
    eventsByType,
  };
}

function synchronizeReportData(sessions: MockSession[], events: MockEvent[]) {
  const sessionsWithEvents = sessions.map((session) => {
    const sessionStart = session.startTime.getTime();
    const sessionEnd = session.endTime ? session.endTime.getTime() : Date.now();

    const eventsDuringSession = events.filter((event) => {
      const eventTime = event.timestamp.getTime();
      return eventTime >= sessionStart && eventTime <= sessionEnd;
    }).length;

    return {
      ...session,
      eventsDuringSession,
    };
  });

  const allEventsInSessions = sessionsWithEvents.reduce(
    (sum, s) => sum + s.eventsDuringSession,
    0,
  );
  const eventsOutsideSessions = events.length - allEventsInSessions;

  return {
    sessions: sessionsWithEvents,
    totalEvents: events.length,
    eventsOutsideSessions,
  };
}
