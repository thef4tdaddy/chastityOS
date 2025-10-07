/**
 * PWA Update Manager Tests
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

describe("PWAUpdateManager", () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  it("should be importable", async () => {
    const { pwaUpdateManager } = await import("../PWAUpdateManager");
    expect(pwaUpdateManager).toBeDefined();
  });

  it("should have checkForUpdates method", async () => {
    const { pwaUpdateManager } = await import("../PWAUpdateManager");
    expect(typeof pwaUpdateManager.checkForUpdates).toBe("function");
  });

  it("should have applyUpdate method", async () => {
    const { pwaUpdateManager } = await import("../PWAUpdateManager");
    expect(typeof pwaUpdateManager.applyUpdate).toBe("function");
  });

  it("should have onUpdateAvailable method", async () => {
    const { pwaUpdateManager } = await import("../PWAUpdateManager");
    expect(typeof pwaUpdateManager.onUpdateAvailable).toBe("function");
  });

  it("should return unsubscribe function from onUpdateAvailable", async () => {
    const { pwaUpdateManager } = await import("../PWAUpdateManager");
    const unsubscribe = pwaUpdateManager.onUpdateAvailable(() => {
      // Mock listener
    });
    expect(typeof unsubscribe).toBe("function");
  });

  it("should handle checkForUpdates when no registration", async () => {
    const { pwaUpdateManager } = await import("../PWAUpdateManager");
    // Should not throw
    await expect(pwaUpdateManager.checkForUpdates()).resolves.toBeUndefined();
  });

  it("should handle applyUpdate when no waiting worker", async () => {
    const { pwaUpdateManager } = await import("../PWAUpdateManager");
    // Should not throw
    await expect(pwaUpdateManager.applyUpdate()).resolves.toBeUndefined();
  });
});
