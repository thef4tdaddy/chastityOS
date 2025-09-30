/**
 * Tests for useAdminDashboard hook
 */
import { describe, it, expect } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAdminDashboard } from "../useAdminDashboard";

describe("useAdminDashboard", () => {
  it("should initialize with default state", () => {
    const { result } = renderHook(() => useAdminDashboard());

    expect(result.current.wearers).toEqual([]);
    expect(result.current.recentActivity).toEqual([]);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("should finish loading", async () => {
    const { result } = renderHook(() => useAdminDashboard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("should calculate statistics correctly", async () => {
    const { result } = renderHook(() => useAdminDashboard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.statistics.totalWearers).toBe(0);
    expect(result.current.statistics.activeSessions).toBe(0);
  });

  it("should pause all sessions", async () => {
    const { result } = renderHook(() => useAdminDashboard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.pauseAllSessions();
    });

    expect(result.current.error).toBeNull();
  });

  it("should resume all sessions", async () => {
    const { result } = renderHook(() => useAdminDashboard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.resumeAllSessions();
    });

    expect(result.current.error).toBeNull();
  });

  it("should refresh data", async () => {
    const { result } = renderHook(() => useAdminDashboard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.refreshData();
    });

    expect(result.current.lastUpdate).not.toBeNull();
  });

  it("should apply filter", async () => {
    const { result } = renderHook(() => useAdminDashboard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.filterBy({ showActive: true });
    });

    expect(result.current.currentFilter.showActive).toBe(true);
  });
});
