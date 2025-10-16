/**
 * PWA Install Manager Tests
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

describe("PWAInstallManager", () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  it("should be importable", async () => {
    const { pwaInstallManager } = await import("../PWAInstallManager");
    expect(pwaInstallManager).toBeDefined();
  });

  it("should have canInstall method", async () => {
    const { pwaInstallManager } = await import("../PWAInstallManager");
    expect(typeof pwaInstallManager.canInstall).toBe("function");
  });

  it("should have promptInstall method", async () => {
    const { pwaInstallManager } = await import("../PWAInstallManager");
    expect(typeof pwaInstallManager.promptInstall).toBe("function");
  });

  it("should have onInstallAvailable method", async () => {
    const { pwaInstallManager } = await import("../PWAInstallManager");
    expect(typeof pwaInstallManager.onInstallAvailable).toBe("function");
  });

  it("should have onAppInstalled method", async () => {
    const { pwaInstallManager } = await import("../PWAInstallManager");
    expect(typeof pwaInstallManager.onAppInstalled).toBe("function");
  });

  it("should return false for canInstall when no prompt available", async () => {
    const { pwaInstallManager } = await import("../PWAInstallManager");
    expect(pwaInstallManager.canInstall()).toBe(false);
  });

  it("should return unsubscribe function from onInstallAvailable", async () => {
    const { pwaInstallManager } = await import("../PWAInstallManager");
    const unsubscribe = pwaInstallManager.onInstallAvailable(() => {
      // Mock listener
    });
    expect(typeof unsubscribe).toBe("function");
  });

  it("should return unsubscribe function from onAppInstalled", async () => {
    const { pwaInstallManager } = await import("../PWAInstallManager");
    const unsubscribe = pwaInstallManager.onAppInstalled(() => {
      // Mock listener
    });
    expect(typeof unsubscribe).toBe("function");
  });
});
