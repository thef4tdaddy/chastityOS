/**
 * Request Batching and Deduplication Service
 * Batches multiple API calls and deduplicates identical requests
 * Phase 4: Advanced Optimizations - Network Optimization
 */

import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("RequestBatching");

interface BatchRequest {
  id: string;
  endpoint: string;
  params?: Record<string, unknown>;
  resolve: (data: unknown) => void;
  reject: (error: Error) => void;
}

interface PendingRequest {
  promise: Promise<unknown>;
  timestamp: number;
}

class RequestBatchingService {
  private batchQueue: BatchRequest[] = [];
  private batchTimeout: ReturnType<typeof setTimeout> | null = null;
  private batchDelay = 50; // ms - delay before processing batch
  private maxBatchSize = 10; // Maximum requests per batch
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private deduplicationWindow = 1000; // ms - deduplication window

  /**
   * Add a request to the batch queue
   */
  async batchRequest<T>(
    endpoint: string,
    params?: Record<string, unknown>,
  ): Promise<T> {
    const requestId = this.generateRequestId(endpoint, params);

    // Check for duplicate request in deduplication window
    const pending = this.pendingRequests.get(requestId);
    if (pending && Date.now() - pending.timestamp < this.deduplicationWindow) {
      logger.debug("Request deduplicated", { endpoint, requestId });
      return pending.promise as Promise<T>;
    }

    // Create new request promise
    const promise = new Promise<T>((resolve, reject) => {
      const request: BatchRequest = {
        id: requestId,
        endpoint,
        params,
        resolve: resolve as (data: unknown) => void,
        reject,
      };

      this.batchQueue.push(request);
      logger.debug("Request queued", {
        endpoint,
        requestId,
        queueSize: this.batchQueue.length,
      });

      // Schedule batch processing
      this.scheduleBatchProcessing();
    });

    // Store in pending requests for deduplication
    this.pendingRequests.set(requestId, {
      promise,
      timestamp: Date.now(),
    });

    return promise;
  }

  /**
   * Schedule batch processing
   */
  private scheduleBatchProcessing(): void {
    // Clear existing timeout
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    // Process immediately if batch is full
    if (this.batchQueue.length >= this.maxBatchSize) {
      this.processBatch();
      return;
    }

    // Schedule batch processing
    this.batchTimeout = setTimeout(() => {
      this.processBatch();
    }, this.batchDelay);
  }

  /**
   * Process the batch queue
   */
  private async processBatch(): Promise<void> {
    if (this.batchQueue.length === 0) {
      return;
    }

    const batch = this.batchQueue.splice(0, this.maxBatchSize);
    logger.info("Processing batch", { size: batch.length });

    try {
      // Group requests by endpoint for efficient batching
      const groupedRequests = this.groupByEndpoint(batch);

      // Process each endpoint group
      for (const [endpoint, requests] of groupedRequests.entries()) {
        await this.processBatchGroup(endpoint, requests);
      }
    } catch (error) {
      logger.error("Batch processing failed", { error: error as Error });
      // Reject all requests in the batch
      batch.forEach((request) => {
        request.reject(error as Error);
        this.pendingRequests.delete(request.id);
      });
    }
  }

  /**
   * Process a group of requests for the same endpoint
   */
  private async processBatchGroup(
    endpoint: string,
    requests: BatchRequest[],
  ): Promise<void> {
    try {
      // For now, execute requests individually
      // In a real implementation, this would call a batch API endpoint
      const results = await Promise.allSettled(
        requests.map((req) => this.executeRequest(req.endpoint, req.params)),
      );

      // Resolve/reject individual requests
      results.forEach((result, index) => {
        const request = requests[index];
        if (!request) return;
        if (result.status === "fulfilled") {
          request.resolve(result.value);
        } else {
          request.reject(result.reason);
        }
        this.pendingRequests.delete(request.id);
      });
    } catch (error) {
      logger.error("Batch group processing failed", {
        endpoint,
        error: error as Error,
      });
      throw error;
    }
  }

  /**
   * Execute a single request
   */
  private async executeRequest(
    endpoint: string,
    params?: Record<string, unknown>,
  ): Promise<unknown> {
    // This is a placeholder - in a real app, this would call the actual API
    logger.debug("Executing request", { endpoint, params });

    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ endpoint, params, result: "success" });
      }, 10);
    });
  }

  /**
   * Group requests by endpoint
   */
  private groupByEndpoint(
    requests: BatchRequest[],
  ): Map<string, BatchRequest[]> {
    const grouped = new Map<string, BatchRequest[]>();

    for (const request of requests) {
      const existing = grouped.get(request.endpoint) || [];
      existing.push(request);
      grouped.set(request.endpoint, existing);
    }

    return grouped;
  }

  /**
   * Generate a unique request ID for deduplication
   */
  private generateRequestId(
    endpoint: string,
    params?: Record<string, unknown>,
  ): string {
    const paramString = params ? JSON.stringify(params) : "";
    return `${endpoint}:${paramString}`;
  }

  /**
   * Clean up old pending requests
   */
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, pending] of this.pendingRequests.entries()) {
      if (now - pending.timestamp > this.deduplicationWindow) {
        this.pendingRequests.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug("Cleaned up pending requests", { count: cleaned });
    }
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      queueSize: this.batchQueue.length,
      pendingRequests: this.pendingRequests.size,
      maxBatchSize: this.maxBatchSize,
      batchDelay: this.batchDelay,
    };
  }
}

// Export singleton instance
export const requestBatchingService = new RequestBatchingService();

// Run cleanup periodically
if (typeof window !== "undefined") {
  setInterval(() => {
    requestBatchingService.cleanup();
  }, 10000); // Every 10 seconds
}
