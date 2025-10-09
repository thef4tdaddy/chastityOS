/**
 * Query Cache Service
 * Provides query result caching for database operations
 * Phase 4: Advanced Optimizations - Database Query Optimization
 */

import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("QueryCache");

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds (default: 5 minutes)
  invalidateOn?: string[]; // Keys to invalidate when this cache is set
}

class QueryCacheService {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes
  private maxCacheSize = 100; // Maximum number of cache entries

  /**
   * Get cached data
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      logger.debug("Cache miss", { key });
      return null;
    }

    // Check if cache entry is still valid
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      logger.debug("Cache expired", { key });
      this.cache.delete(key);
      return null;
    }

    logger.debug("Cache hit", { key });
    return entry.data;
  }

  /**
   * Set cached data
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const { ttl = this.defaultTTL, invalidateOn = [] } = options;

    // Invalidate related cache entries
    if (invalidateOn.length > 0) {
      invalidateOn.forEach((pattern) => this.invalidatePattern(pattern));
    }

    // Enforce max cache size (simple LRU: remove oldest)
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value as string;
      this.cache.delete(oldestKey);
      logger.debug("Cache evicted (size limit)", { key: oldestKey });
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });

    logger.debug("Cache set", { key, ttl });
  }

  /**
   * Invalidate a specific cache key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    logger.debug("Cache invalidated", { key });
  }

  /**
   * Invalidate cache entries matching a pattern
   */
  invalidatePattern(pattern: string): void {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        count++;
      }
    }
    if (count > 0) {
      logger.debug("Cache pattern invalidated", { pattern, count });
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    logger.info("Cache cleared", { entries: size });
  }

  /**
   * Get or set with a loader function
   */
  async getOrSet<T>(
    key: string,
    loader: () => Promise<T>,
    options?: CacheOptions,
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await loader();
    this.set(key, data, options);
    return data;
  }

  /**
   * Wrap a query function with caching
   */
  withCache<TArgs extends unknown[], TResult>(
    keyPrefix: string,
    queryFn: (...args: TArgs) => Promise<TResult>,
    options?: CacheOptions,
  ): (...args: TArgs) => Promise<TResult> {
    return async (...args: TArgs): Promise<TResult> => {
      const key = `${keyPrefix}:${JSON.stringify(args)}`;
      return this.getOrSet(key, () => queryFn(...args), options);
    };
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const entry of this.cache.values()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }

    return {
      total: this.cache.size,
      valid: validEntries,
      expired: expiredEntries,
      maxSize: this.maxCacheSize,
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug("Cache cleanup completed", { cleaned });
    }
  }
}

// Export singleton instance
export const queryCacheService = new QueryCacheService();

// Run cleanup periodically (every 5 minutes)
if (typeof window !== "undefined") {
  setInterval(
    () => {
      queryCacheService.cleanup();
    },
    5 * 60 * 1000,
  );
}
