/**
 * useRetryableOperation
 * Hook for operations that should be retryable on failure
 * Provides automatic retry with exponential backoff for transient failures
 */

import { useState, useCallback } from "react";
import { logger } from "@/utils/logging";

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  retryableErrors?: string[]; // Error messages that should trigger retry
}

interface RetryState {
  attemptCount: number;
  lastError: Error | null;
  isRetrying: boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  retryableErrors: [
    "network",
    "timeout",
    "fetch",
    "ECONNRESET",
    "temporarily unavailable",
  ],
};

/**
 * Check if an error is retryable
 */
const isRetryableError = (error: Error, retryableErrors: string[]): boolean => {
  const message = error.message.toLowerCase();
  return retryableErrors.some((pattern) =>
    message.includes(pattern.toLowerCase()),
  );
};

/**
 * Calculate delay with exponential backoff
 */
const calculateDelay = (
  attemptCount: number,
  baseDelay: number,
  maxDelay: number,
): number => {
  const delay = Math.min(baseDelay * Math.pow(2, attemptCount), maxDelay);
  // Add jitter to avoid thundering herd
  const jitter = Math.random() * 0.3 * delay;
  return delay + jitter;
};

export const useRetryableOperation = (options: RetryOptions = {}) => {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const [retryState, setRetryState] = useState<RetryState>({
    attemptCount: 0,
    lastError: null,
    isRetrying: false,
  });

  /**
   * Execute an operation with automatic retry
   */
  const executeWithRetry = useCallback(
    async <T>(
      operation: () => Promise<T>,
      operationName: string,
    ): Promise<T> => {
      let attemptCount = 0;
      let lastError: Error | null = null;

      while (attemptCount <= opts.maxRetries) {
        try {
          setRetryState({
            attemptCount,
            lastError: null,
            isRetrying: attemptCount > 0,
          });

          const result = await operation();

          // Success - reset state
          if (attemptCount > 0) {
            logger.info(
              `Operation succeeded after ${attemptCount} retry attempt(s)`,
              { operationName },
            );
          }

          setRetryState({
            attemptCount: 0,
            lastError: null,
            isRetrying: false,
          });

          return result;
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          lastError = err;
          attemptCount++;

          logger.warn(`Operation failed (attempt ${attemptCount})`, {
            operationName,
            error: err.message,
            willRetry:
              attemptCount <= opts.maxRetries &&
              isRetryableError(err, opts.retryableErrors),
          });

          // Check if we should retry
          if (
            attemptCount <= opts.maxRetries &&
            isRetryableError(err, opts.retryableErrors)
          ) {
            const delay = calculateDelay(
              attemptCount - 1,
              opts.baseDelay,
              opts.maxDelay,
            );

            logger.debug(
              `Retrying operation after ${Math.round(delay)}ms delay`,
              {
                operationName,
                attemptCount,
              },
            );

            setRetryState({
              attemptCount,
              lastError: err,
              isRetrying: true,
            });

            // Wait before retry
            await new Promise((resolve) => setTimeout(resolve, delay));
          } else {
            // Max retries exceeded or non-retryable error
            setRetryState({
              attemptCount,
              lastError: err,
              isRetrying: false,
            });

            logger.error(`Operation failed after ${attemptCount} attempts`, {
              operationName,
              error: err.message,
            });

            throw err;
          }
        }
      }

      // Should not reach here, but TypeScript needs it
      throw lastError || new Error("Operation failed");
    },
    [opts.maxRetries, opts.baseDelay, opts.maxDelay, opts.retryableErrors],
  );

  /**
   * Reset retry state
   */
  const resetRetryState = useCallback(() => {
    setRetryState({
      attemptCount: 0,
      lastError: null,
      isRetrying: false,
    });
  }, []);

  return {
    executeWithRetry,
    retryState,
    resetRetryState,
    isRetrying: retryState.isRetrying,
  };
};
