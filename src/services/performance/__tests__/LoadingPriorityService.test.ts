/**
 * Tests for Loading Priority Service
 * Phase 4: Advanced Optimizations - Progressive Loading
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  loadingPriorityService,
  LoadingPriority,
} from "../LoadingPriorityService";

describe("LoadingPriorityService", () => {
  beforeEach(() => {
    loadingPriorityService.reset();
  });

  it("should register a feature", () => {
    loadingPriorityService.registerFeature({
      name: "test-feature",
      priority: LoadingPriority.CRITICAL,
      loader: async () => {},
    });

    const stats = loadingPriorityService.getStats();
    expect(stats.total).toBe(1);
  });

  it("should load a feature", async () => {
    const loader = vi.fn().mockResolvedValue(undefined);

    loadingPriorityService.registerFeature({
      name: "test-feature",
      priority: LoadingPriority.CRITICAL,
      loader,
    });

    await loadingPriorityService.loadFeature("test-feature");

    expect(loader).toHaveBeenCalled();
    expect(loadingPriorityService.isFeatureLoaded("test-feature")).toBe(true);
  });

  it("should load features by priority", async () => {
    const criticalLoader = vi.fn().mockResolvedValue(undefined);
    const highLoader = vi.fn().mockResolvedValue(undefined);

    loadingPriorityService.registerFeature({
      name: "critical-feature",
      priority: LoadingPriority.CRITICAL,
      loader: criticalLoader,
    });

    loadingPriorityService.registerFeature({
      name: "high-feature",
      priority: LoadingPriority.HIGH,
      loader: highLoader,
    });

    await loadingPriorityService.loadByPriority(LoadingPriority.CRITICAL);

    expect(criticalLoader).toHaveBeenCalled();
    expect(highLoader).not.toHaveBeenCalled();
  });

  it("should handle dependencies", async () => {
    const depLoader = vi.fn().mockResolvedValue(undefined);
    const mainLoader = vi.fn().mockResolvedValue(undefined);

    loadingPriorityService.registerFeature({
      name: "dependency",
      priority: LoadingPriority.CRITICAL,
      loader: depLoader,
    });

    loadingPriorityService.registerFeature({
      name: "main-feature",
      priority: LoadingPriority.CRITICAL,
      loader: mainLoader,
      dependencies: ["dependency"],
    });

    await loadingPriorityService.loadFeature("main-feature");

    expect(depLoader).toHaveBeenCalled();
    expect(mainLoader).toHaveBeenCalled();
  });

  it("should mark core as loaded after priority 1", async () => {
    const loader = vi.fn().mockResolvedValue(undefined);
    const coreCallback = vi.fn();

    loadingPriorityService.onCoreLoaded(coreCallback);

    loadingPriorityService.registerFeature({
      name: "critical-feature",
      priority: LoadingPriority.CRITICAL,
      loader,
    });

    await loadingPriorityService.loadByPriority(LoadingPriority.CRITICAL);

    expect(loadingPriorityService.isCoreReady()).toBe(true);
    expect(coreCallback).toHaveBeenCalled();
  });

  it("should deduplicate loading requests", async () => {
    const loader = vi.fn().mockResolvedValue(undefined);

    loadingPriorityService.registerFeature({
      name: "test-feature",
      priority: LoadingPriority.CRITICAL,
      loader,
    });

    // Load the same feature multiple times simultaneously
    await Promise.all([
      loadingPriorityService.loadFeature("test-feature"),
      loadingPriorityService.loadFeature("test-feature"),
      loadingPriorityService.loadFeature("test-feature"),
    ]);

    // Should only be called once
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("should get correct stats", () => {
    loadingPriorityService.registerFeature({
      name: "feature-1",
      priority: LoadingPriority.CRITICAL,
      loader: async () => {},
    });

    loadingPriorityService.registerFeature({
      name: "feature-2",
      priority: LoadingPriority.HIGH,
      loader: async () => {},
    });

    const stats = loadingPriorityService.getStats();
    expect(stats.total).toBe(2);
    expect(stats.loaded).toBe(0);
    expect(stats.pending).toBe(2);
  });
});
