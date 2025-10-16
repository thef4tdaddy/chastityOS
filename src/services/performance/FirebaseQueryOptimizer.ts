/**
 * Firebase Query Optimizer
 * Optimizes Firestore queries with caching and performance best practices
 * Phase 4: Advanced Optimizations - Firebase Query Optimization
 */

import {
  Query,
  QueryConstraint,
  query,
  limit,
  limitToLast,
  startAfter,
  endBefore,
  DocumentSnapshot,
} from "firebase/firestore";
import { queryCacheService } from "./QueryCacheService";
import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("FirebaseQueryOptimizer");

export interface PaginationOptions {
  pageSize?: number;
  direction?: "forward" | "backward";
  cursor?: DocumentSnapshot;
}

export interface QueryOptions {
  cache?: boolean;
  cacheTTL?: number;
  pagination?: PaginationOptions;
}

class FirebaseQueryOptimizer {
  private readonly defaultPageSize = 20;
  private readonly defaultCacheTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Create an optimized query with pagination
   */
  createPaginatedQuery<T>(
    baseQuery: Query<T>,
    constraints: QueryConstraint[],
    options: QueryOptions = {},
  ): Query<T> {
    const { pagination = {}, cache = false } = options;

    const {
      pageSize = this.defaultPageSize,
      direction = "forward",
      cursor,
    } = pagination;

    // Build query with constraints
    let optimizedQuery = query(baseQuery, ...constraints);

    // Add pagination
    if (direction === "forward") {
      if (cursor) {
        optimizedQuery = query(optimizedQuery, startAfter(cursor));
      }
      optimizedQuery = query(optimizedQuery, limit(pageSize));
    } else {
      if (cursor) {
        optimizedQuery = query(optimizedQuery, endBefore(cursor));
      }
      optimizedQuery = query(optimizedQuery, limitToLast(pageSize));
    }

    if (cache) {
      logger.debug("Query created with caching enabled", {
        pageSize,
        direction,
        hasCursor: !!cursor,
      });
    }

    return optimizedQuery;
  }

  /**
   * Execute a query with caching
   */
  async executeWithCache<T>(
    queryKey: string,
    executor: () => Promise<T>,
    options: QueryOptions = {},
  ): Promise<T> {
    const { cache = true, cacheTTL = this.defaultCacheTTL } = options;

    if (!cache) {
      return executor();
    }

    return queryCacheService.getOrSet(queryKey, executor, { ttl: cacheTTL });
  }

  /**
   * Generate a cache key for a query
   */
  generateCacheKey(
    collection: string,
    constraints: Record<string, unknown>,
  ): string {
    return `firestore:${collection}:${JSON.stringify(constraints)}`;
  }

  /**
   * Invalidate cache for a collection
   */
  invalidateCollectionCache(collection: string): void {
    queryCacheService.invalidatePattern(`firestore:${collection}`);
    logger.debug("Cache invalidated for collection", { collection });
  }

  /**
   * Batch multiple queries for efficiency
   */
  async batchQueries<T>(
    queries: Array<() => Promise<T>>,
  ): Promise<PromiseSettledResult<T>[]> {
    logger.debug("Executing batch queries", { count: queries.length });

    const startTime = performance.now();
    const results = await Promise.allSettled(queries.map((query) => query()));
    const duration = performance.now() - startTime;

    logger.info("Batch queries completed", {
      count: queries.length,
      duration,
      failed: results.filter((r) => r.status === "rejected").length,
    });

    return results;
  }

  /**
   * Create a query with performance monitoring
   */
  async monitorQuery<T>(
    queryName: string,
    executor: () => Promise<T>,
  ): Promise<T> {
    const startTime = performance.now();

    try {
      const result = await executor();
      const duration = performance.now() - startTime;

      logger.info("Query completed", {
        query: queryName,
        duration,
        success: true,
      });

      // Warn about slow queries
      if (duration > 1000) {
        logger.warn("Slow query detected", {
          query: queryName,
          duration,
        });
      }

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;

      logger.error("Query failed", {
        query: queryName,
        duration,
        error: error as Error,
      });

      throw error;
    }
  }

  /**
   * Optimize query for real-time listeners
   * Returns cleanup function
   */
  optimizeRealtimeListener(
    listenerName: string,
    onData: (data: unknown) => void,
    _onError: (error: Error) => void,
  ): {
    update: (data: unknown) => void;
    cleanup: () => void;
  } {
    let isActive = true;
    let updateTimer: ReturnType<typeof setTimeout> | null = null;
    let pendingData: unknown = null;

    // Debounce updates to reduce re-renders
    const update = (data: unknown) => {
      if (!isActive) return;

      pendingData = data;

      if (updateTimer) {
        clearTimeout(updateTimer);
      }

      updateTimer = setTimeout(() => {
        if (pendingData !== null && isActive) {
          onData(pendingData);
          pendingData = null;
        }
      }, 100); // 100ms debounce
    };

    const cleanup = () => {
      isActive = false;
      if (updateTimer) {
        clearTimeout(updateTimer);
      }
      logger.debug("Listener cleanup", { listenerName });
    };

    logger.debug("Listener optimized", { listenerName });

    return { update, cleanup };
  }

  /**
   * Get query statistics
   */
  getStats() {
    return {
      cacheStats: queryCacheService.getStats(),
    };
  }
}

// Export singleton instance
export const firebaseQueryOptimizer = new FirebaseQueryOptimizer();
