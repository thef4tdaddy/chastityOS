import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSpecialChallenges } from "../useSpecialChallenges";
import { goalDBService } from "@/services/database/GoalDBService";

// Mock the goal service
vi.mock("@/services/database/GoalDBService", () => ({
  goalDBService: {
    getSpecialChallengeGoals: vi.fn(),
    getOrCreateChallengeGoal: vi.fn(),
    updateGoalProgress: vi.fn(),
  },
}));

// Mock the logger
vi.mock("@/utils/logging", () => ({
  serviceLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  }),
}));

describe("useSpecialChallenges", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock current date to be in October for Locktober testing
    vi.setSystemTime(new Date(2024, 9, 15)); // October 15, 2024
  });

  it("should initialize with correct availability for October", () => {
    vi.mocked(goalDBService.getSpecialChallengeGoals).mockResolvedValue([]);

    const { result } = renderHook(() => useSpecialChallenges("test-user"));

    expect(result.current.isLoading).toBe(true);
    // Availability should be checked in the hook
  });

  it("should identify Locktober as available in October", async () => {
    vi.mocked(goalDBService.getSpecialChallengeGoals).mockResolvedValue([]);

    const { result } = renderHook(() => useSpecialChallenges("test-user"));

    // Wait for initial load
    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.challengeStatus.locktober.available).toBe(true);
    expect(result.current.challengeStatus.noNutNovember.available).toBe(false);
  });

  it("should handle joining a challenge", async () => {
    const mockGoal = {
      id: "test-goal",
      challengeType: "locktober" as const,
      title: "Locktober 2024",
      isCompleted: false,
    };

    vi.mocked(goalDBService.getSpecialChallengeGoals).mockResolvedValue([]);
    vi.mocked(goalDBService.getOrCreateChallengeGoal).mockResolvedValue(
      mockGoal as any,
    );

    const { result } = renderHook(() => useSpecialChallenges("test-user"));

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const joinResult = await result.current.joinChallenge("locktober");
    expect(joinResult).toEqual(mockGoal);
    expect(goalDBService.getOrCreateChallengeGoal).toHaveBeenCalledWith(
      "test-user",
      "locktober",
    );
  });
});
