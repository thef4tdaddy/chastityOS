/**
 * Tests for useSession hook
 */
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useSession } from "../useSession";

// Mock the logger
vi.mock("../../../utils/logging", () => ({
  serviceLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  }),
}));

// Mock the KeyholderRelationshipService
vi.mock("../../../services/KeyholderRelationshipService", () => ({
  KeyholderRelationshipService: {
    getUserRelationships: vi.fn().mockResolvedValue({
      asSubmissive: [],
      asKeyholder: [],
    }),
  },
}));

describe("useSession", () => {
  it("should initialize with default state", () => {
    const { result } = renderHook(() => useSession("test-user-id"));

    expect(result.current.session).toBeNull();
    expect(result.current.isActive).toBe(false);
    expect(result.current.duration).toBe(0);
    expect(result.current.goalProgress).toBe(0);
    expect(result.current.isUnderKeyholderControl).toBe(false);
    expect(result.current.canSelfModify).toBe(true);
  });

  it("should handle starting a session", async () => {
    const { result } = renderHook(() => useSession("test-user-id"));

    await act(async () => {
      const session = await result.current.startSession();
      expect(session).toBeDefined();
      expect(session.userId).toBe("test-user-id");
    });

    expect(result.current.session).toBeDefined();
    expect(result.current.isActive).toBe(true);
  });

  it("should handle stopping a session", async () => {
    const { result } = renderHook(() => useSession("test-user-id"));

    // Start a session first
    await act(async () => {
      await result.current.startSession();
    });

    // Then stop it
    await act(async () => {
      await result.current.stopSession("test reason");
    });

    expect(result.current.session?.endTime).toBeDefined();
    expect(result.current.session?.endReason).toBe("test reason");
  });

  it("should provide session insights", () => {
    const { result } = renderHook(() => useSession("test-user-id"));

    const insights = result.current.getSessionInsights();
    expect(insights).toBeDefined();
    expect(insights.predictedDuration).toBeGreaterThanOrEqual(0);
    expect(insights.completionProbability).toBeGreaterThanOrEqual(0);
    expect(insights.recommendations).toBeInstanceOf(Array);
  });

  it("should provide predictive analytics", () => {
    const { result } = renderHook(() => useSession("test-user-id"));

    const analytics = result.current.getPredictiveAnalytics();
    expect(analytics).toBeDefined();
    expect(analytics.nextSessionPrediction).toBeDefined();
    expect(analytics.weeklyTrend).toBeDefined();
  });
});
