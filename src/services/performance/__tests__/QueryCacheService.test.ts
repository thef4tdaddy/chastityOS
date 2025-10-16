/**
 * Tests for Query Cache Service
 * Phase 4: Advanced Optimizations - Database Query Optimization
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { queryCacheService } from "../QueryCacheService";

describe("QueryCacheService", () => {
  beforeEach(() => {
    queryCacheService.clear();
  });

  it("should cache and retrieve data", () => {
    const data = { id: 1, name: "test" };
    queryCacheService.set("test-key", data);

    const retrieved = queryCacheService.get("test-key");
    expect(retrieved).toEqual(data);
  });

  it("should return null for cache miss", () => {
    const result = queryCacheService.get("non-existent");
    expect(result).toBeNull();
  });

  it("should respect TTL", async () => {
    queryCacheService.set("test-key", "data", { ttl: 100 });

    // Should be available immediately
    expect(queryCacheService.get("test-key")).toBe("data");

    // Wait for TTL to expire
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Should be expired
    expect(queryCacheService.get("test-key")).toBeNull();
  });

  it("should invalidate specific keys", () => {
    queryCacheService.set("key1", "data1");
    queryCacheService.set("key2", "data2");

    queryCacheService.invalidate("key1");

    expect(queryCacheService.get("key1")).toBeNull();
    expect(queryCacheService.get("key2")).toBe("data2");
  });

  it("should invalidate by pattern", () => {
    queryCacheService.set("user:1", "data1");
    queryCacheService.set("user:2", "data2");
    queryCacheService.set("task:1", "data3");

    queryCacheService.invalidatePattern("user:");

    expect(queryCacheService.get("user:1")).toBeNull();
    expect(queryCacheService.get("user:2")).toBeNull();
    expect(queryCacheService.get("task:1")).toBe("data3");
  });

  it("should use getOrSet for lazy loading", async () => {
    const loader = vi.fn().mockResolvedValue("loaded-data");

    const result1 = await queryCacheService.getOrSet("test-key", loader);
    expect(result1).toBe("loaded-data");
    expect(loader).toHaveBeenCalledTimes(1);

    // Second call should use cache
    const result2 = await queryCacheService.getOrSet("test-key", loader);
    expect(result2).toBe("loaded-data");
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("should wrap functions with cache", async () => {
    const queryFn = vi.fn((id: number) =>
      Promise.resolve({ id, name: "test" }),
    );
    const cachedFn = queryCacheService.withCache("query", queryFn);

    await cachedFn(1);
    await cachedFn(1);

    // Should only call original function once
    expect(queryFn).toHaveBeenCalledTimes(1);
  });

  it("should enforce max cache size", () => {
    // Fill cache beyond max size (100)
    for (let i = 0; i < 110; i++) {
      queryCacheService.set(`key${i}`, `data${i}`);
    }

    const stats = queryCacheService.getStats();
    expect(stats.total).toBeLessThanOrEqual(100);
  });

  it("should clean up expired entries", async () => {
    queryCacheService.set("key1", "data1", { ttl: 50 });
    queryCacheService.set("key2", "data2", { ttl: 10000 });

    // Wait for first entry to expire
    await new Promise((resolve) => setTimeout(resolve, 100));

    queryCacheService.cleanup();

    const stats = queryCacheService.getStats();
    expect(stats.valid).toBe(1);
  });

  it("should provide accurate stats", () => {
    queryCacheService.set("key1", "data1");
    queryCacheService.set("key2", "data2");

    const stats = queryCacheService.getStats();
    expect(stats.total).toBe(2);
    expect(stats.valid).toBe(2);
    expect(stats.expired).toBe(0);
  });
});
