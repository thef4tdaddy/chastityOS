import { describe, it, expect } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useRuleEditor } from "../useRuleEditor";

describe("useRuleEditor", () => {
  it("should initialize with empty rules", async () => {
    const { result } = renderHook(() => useRuleEditor());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.rules).toEqual([]);
  });

  it("should create a rule", async () => {
    const { result } = renderHook(() => useRuleEditor());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      await result.current.createRule({ title: "Test Rule" });
    });
    expect(result.current.rules).toHaveLength(1);
  });
});
