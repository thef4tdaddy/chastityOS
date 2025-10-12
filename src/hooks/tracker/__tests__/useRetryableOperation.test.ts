/**
 * Tests for useRetryableOperation hook
 */
import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useRetryableOperation } from "../useRetryableOperation";

describe("useRetryableOperation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should execute operation successfully on first try", async () => {
    const { result } = renderHook(() => useRetryableOperation());
    const mockOperation = vi.fn().mockResolvedValue("success");

    const response = await result.current.executeWithRetry(
      mockOperation,
      "testOperation",
    );

    expect(response).toBe("success");
    expect(mockOperation).toHaveBeenCalledTimes(1);
    expect(result.current.isRetrying).toBe(false);
  });

  it("should retry on network errors", async () => {
    const { result } = renderHook(() =>
      useRetryableOperation({ maxRetries: 2, baseDelay: 10 }),
    );

    const mockOperation = vi
      .fn()
      .mockRejectedValueOnce(new Error("network error"))
      .mockResolvedValue("success");

    const response = await result.current.executeWithRetry(
      mockOperation,
      "testOperation",
    );

    expect(response).toBe("success");
    expect(mockOperation).toHaveBeenCalledTimes(2);
  });

  it("should throw error after max retries exceeded", async () => {
    const { result } = renderHook(() =>
      useRetryableOperation({ maxRetries: 2, baseDelay: 10 }),
    );

    const mockOperation = vi.fn().mockRejectedValue(new Error("network error"));

    await expect(
      result.current.executeWithRetry(mockOperation, "testOperation"),
    ).rejects.toThrow("network error");

    expect(mockOperation).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });

  it("should not retry on non-retryable errors", async () => {
    const { result } = renderHook(() =>
      useRetryableOperation({ maxRetries: 2, baseDelay: 10 }),
    );

    const mockOperation = vi
      .fn()
      .mockRejectedValue(new Error("permission denied"));

    await expect(
      result.current.executeWithRetry(mockOperation, "testOperation"),
    ).rejects.toThrow("permission denied");

    expect(mockOperation).toHaveBeenCalledTimes(1); // No retries for non-network errors
  });

  it("should update isRetrying state during retry", async () => {
    const { result } = renderHook(() =>
      useRetryableOperation({ maxRetries: 1, baseDelay: 10 }),
    );

    const mockOperation = vi
      .fn()
      .mockRejectedValueOnce(new Error("network error"))
      .mockResolvedValue("success");

    const promise = result.current.executeWithRetry(
      mockOperation,
      "testOperation",
    );

    // Wait a bit for retry to start
    await waitFor(
      () => {
        expect(result.current.isRetrying).toBe(true);
      },
      { timeout: 50 },
    );

    await promise;

    expect(result.current.isRetrying).toBe(false);
  });

  it("should apply exponential backoff", async () => {
    const { result } = renderHook(() =>
      useRetryableOperation({ maxRetries: 2, baseDelay: 100, maxDelay: 1000 }),
    );

    const mockOperation = vi
      .fn()
      .mockRejectedValueOnce(new Error("network error"))
      .mockRejectedValueOnce(new Error("network error"))
      .mockResolvedValue("success");

    const startTime = Date.now();
    await result.current.executeWithRetry(mockOperation, "testOperation");
    const endTime = Date.now();

    // Should have some delay between retries (at least baseDelay)
    expect(endTime - startTime).toBeGreaterThanOrEqual(100);
    expect(mockOperation).toHaveBeenCalledTimes(3);
  });

  it("should reset retry state", async () => {
    const { result } = renderHook(() => useRetryableOperation());

    const mockOperation = vi.fn().mockRejectedValue(new Error("network error"));

    await expect(
      result.current.executeWithRetry(mockOperation, "testOperation"),
    ).rejects.toThrow();

    expect(result.current.retryState.attemptCount).toBeGreaterThan(0);

    result.current.resetRetryState();

    expect(result.current.retryState.attemptCount).toBe(0);
    expect(result.current.retryState.lastError).toBe(null);
  });
});
