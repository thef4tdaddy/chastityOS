import { describe, it, expect } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { usePersonalGoals } from "../usePersonalGoals";

describe("usePersonalGoals", () => {
  it("should initialize with empty goals", async () => {
    const { result } = renderHook(() => usePersonalGoals());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.goals).toEqual([]);
  });

  it("should create a goal", async () => {
    const { result } = renderHook(() => usePersonalGoals());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      await result.current.createGoal({
        title: "Test Goal",
        targetDuration: 3600,
      });
    });
    expect(result.current.goals).toHaveLength(1);
  });
});
