/**
 * Database Performance Monitoring Service
 * Monitors and optimizes database query performance
 */

import { db } from "../storage/ChastityDB";
import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("PerformanceService");

export interface QueryMetrics {
  operation: string;
  table: string;
  duration: number;
  recordCount: number;
  timestamp: Date;
  queryDetails?: {
    filter?: Record<string, unknown>;
    sort?: string;
    limit?: number;
    index?: string;
    error?: string;
  };
}

export interface PerformanceReport {
  totalQueries: number;
  averageQueryTime: number;
  slowestQueries: QueryMetrics[];
  tableStats: Record<
    string,
    {
      queryCount: number;
      averageTime: number;
      totalRecords: number;
    }
  >;
  recommendations: string[];
}

export class DBPerformanceService {
  private static metrics: QueryMetrics[] = [];
  private static readonly MAX_METRICS = 1000; // Keep last 1000 queries
  private static readonly SLOW_QUERY_THRESHOLD = 100; // ms

  /**
   * Record a query metric
   */
  static recordQuery(
    operation: string,
    table: string,
    duration: number,
    recordCount: number,
    queryDetails?: QueryMetrics["queryDetails"],
  ): void {
    const metric: QueryMetrics = {
      operation,
      table,
      duration,
      recordCount,
      timestamp: new Date(),
      queryDetails,
    };

    this.metrics.push(metric);

    // Keep only the last MAX_METRICS entries
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    // Log slow queries
    if (duration > this.SLOW_QUERY_THRESHOLD) {
      logger.warn("Slow query detected", {
        operation,
        table,
        duration,
        recordCount,
        threshold: this.SLOW_QUERY_THRESHOLD,
      });
    }

    logger.debug("Query recorded", { operation, table, duration, recordCount });
  }

  /**
   * Create a performance wrapper for database operations
   */
  static wrapOperation<T>(
    operation: string,
    table: string,
    queryFn: () => Promise<T>,
  ): Promise<T> {
    const startTime = performance.now();

    try {
      const result = await queryFn();
      const duration = performance.now() - startTime;

      // Determine record count
      let recordCount = 0;
      if (Array.isArray(result)) {
        recordCount = result.length;
      } else if (result !== null && result !== undefined) {
        recordCount = 1;
      }

      this.recordQuery(operation, table, duration, recordCount);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordQuery(`${operation}_ERROR`, table, duration, 0, {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Generate performance report
   */
  static generateReport(): PerformanceReport {
    if (this.metrics.length === 0) {
      return {
        totalQueries: 0,
        averageQueryTime: 0,
        slowestQueries: [],
        tableStats: {},
        recommendations: ["No queries recorded yet"],
      };
    }

    const totalQueries = this.metrics.length;
    const averageQueryTime =
      this.metrics.reduce((sum, m) => sum + m.duration, 0) / totalQueries;

    // Find slowest queries
    const slowestQueries = [...this.metrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    // Calculate table statistics
    const tableStats: Record<
      string,
      {
        queryCount: number;
        averageTime: number;
        totalRecords: number;
      }
    > = {};

    for (const metric of this.metrics) {
      if (!tableStats[metric.table]) {
        tableStats[metric.table] = {
          queryCount: 0,
          averageTime: 0,
          totalRecords: 0,
        };
      }

      const stats = tableStats[metric.table];
      stats.queryCount++;
      stats.averageTime =
        (stats.averageTime * (stats.queryCount - 1) + metric.duration) /
        stats.queryCount;
      stats.totalRecords += metric.recordCount;
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      tableStats,
      slowestQueries,
    );

    logger.info("Performance report generated", {
      totalQueries,
      averageQueryTime: Math.round(averageQueryTime * 100) / 100,
      tablesAnalyzed: Object.keys(tableStats).length,
    });

    return {
      totalQueries,
      averageQueryTime,
      slowestQueries,
      tableStats,
      recommendations,
    };
  }

  /**
   * Generate performance recommendations
   */
  private static generateRecommendations(
    tableStats: Record<string, any>,
    slowestQueries: QueryMetrics[],
  ): string[] {
    const recommendations: string[] = [];

    // Check for slow average query times
    for (const [table, stats] of Object.entries(tableStats)) {
      if (stats.averageTime > this.SLOW_QUERY_THRESHOLD) {
        recommendations.push(
          `Consider optimizing queries on ${table} table (avg: ${Math.round(stats.averageTime)}ms)`,
        );
      }
    }

    // Check for frequently queried tables
    const sortedTables = Object.entries(tableStats).sort(
      ([, a], [, b]) => b.queryCount - a.queryCount,
    );

    if (sortedTables.length > 0) {
      const [mostQueriedTable, stats] = sortedTables[0];
      if (stats.queryCount > totalQueries * 0.4) {
        recommendations.push(
          `${mostQueriedTable} table is heavily queried (${stats.queryCount} queries). Consider caching frequently accessed data.`,
        );
      }
    }

    // Check for large result sets
    const largeResultQueries = slowestQueries.filter(
      (q) => q.recordCount > 100,
    );
    if (largeResultQueries.length > 0) {
      recommendations.push(
        `${largeResultQueries.length} queries returned >100 records. Consider implementing pagination.`,
      );
    }

    // Check for error patterns
    const errorQueries = this.metrics.filter((m) =>
      m.operation.endsWith("_ERROR"),
    );
    if (errorQueries.length > totalQueries * 0.05) {
      recommendations.push(
        `High error rate detected (${errorQueries.length}/${totalQueries} queries). Review error handling.`,
      );
    }

    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push(
        "Database performance looks good! No specific optimizations needed.",
      );
    } else {
      recommendations.push(
        "Regular performance monitoring is recommended for optimal database performance.",
      );
    }

    return recommendations;
  }

  /**
   * Run performance benchmarks
   */
  static async runBenchmarks(): Promise<{
    insertPerformance: number;
    queryPerformance: number;
    updatePerformance: number;
    indexEfficiency: number;
  }> {
    logger.info("Starting performance benchmarks");

    const testUserId = "benchmark-user";
    const testData = [];

    try {
      // Clean up any existing benchmark data
      await db.events.where("userId").equals(testUserId).delete();

      // Benchmark INSERT operations
      const insertStart = performance.now();
      for (let i = 0; i < 100; i++) {
        const id = await db.events.add({
          id: `benchmark-event-${i}`,
          userId: testUserId,
          type: "note",
          details: { notes: `Benchmark event ${i}` },
          isPrivate: false,
          timestamp: new Date(),
          syncStatus: "pending",
          lastModified: new Date(),
        });
        testData.push(id);
      }
      const insertTime = performance.now() - insertStart;

      // Benchmark QUERY operations
      const queryStart = performance.now();
      for (let i = 0; i < 50; i++) {
        await db.events.where("userId").equals(testUserId).toArray();
      }
      const queryTime = performance.now() - queryStart;

      // Benchmark UPDATE operations
      const updateStart = performance.now();
      for (const id of testData.slice(0, 50)) {
        await db.events.update(id, { syncStatus: "synced" });
      }
      const updateTime = performance.now() - updateStart;

      // Test index efficiency
      const indexStart = performance.now();
      await db.events
        .where("[userId+type]")
        .equals([testUserId, "note"])
        .toArray();
      const indexTime = performance.now() - indexStart;

      // Clean up benchmark data
      await db.events.where("userId").equals(testUserId).delete();

      const results = {
        insertPerformance: Math.round((insertTime / 100) * 100) / 100, // ms per insert
        queryPerformance: Math.round((queryTime / 50) * 100) / 100, // ms per query
        updatePerformance: Math.round((updateTime / 50) * 100) / 100, // ms per update
        indexEfficiency: Math.round(indexTime * 100) / 100, // ms for indexed query
      };

      logger.info("Performance benchmarks completed", results);
      return results;
    } catch (error) {
      logger.error("Benchmark failed", { error: error as Error });

      // Clean up on error
      try {
        await db.events.where("userId").equals(testUserId).delete();
      } catch (cleanupError) {
        logger.error("Benchmark cleanup failed", {
          error: cleanupError as Error,
        });
      }

      throw error;
    }
  }

  /**
   * Clear performance metrics
   */
  static clearMetrics(): void {
    this.metrics = [];
    logger.info("Performance metrics cleared");
  }

  /**
   * Get current metrics
   */
  static getMetrics(): QueryMetrics[] {
    return [...this.metrics];
  }

  /**
   * Monitor database size and suggest cleanup
   */
  static async analyzeDatabaseSize(): Promise<{
    totalRecords: number;
    tableBreakdown: Record<string, number>;
    sizeRecommendations: string[];
  }> {
    logger.info("Analyzing database size");

    const stats = await db.getStats();
    const totalRecords = Object.values(stats).reduce(
      (sum, count) => sum + count,
      0,
    );

    const sizeRecommendations: string[] = [];

    // Check for large tables
    Object.entries(stats).forEach(([table, count]) => {
      if (count > 10000) {
        sizeRecommendations.push(
          `${table} table has ${count} records. Consider archiving old data.`,
        );
      }
    });

    // Check for old data
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const oldEvents = await db.events
      .where("timestamp")
      .below(oneYearAgo)
      .count();

    if (oldEvents > 1000) {
      sizeRecommendations.push(
        `${oldEvents} events are over 1 year old. Consider archiving to improve performance.`,
      );
    }

    if (sizeRecommendations.length === 0) {
      sizeRecommendations.push("Database size is within recommended limits.");
    }

    const results = {
      totalRecords,
      tableBreakdown: stats,
      sizeRecommendations,
    };

    logger.info("Database size analysis completed", results);
    return results;
  }
}

// Global variable reference
const totalQueries = DBPerformanceService.getMetrics().length;
