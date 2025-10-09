/**
 * useErrorHandler
 * Custom hook for error handling logic
 */

import { useCallback } from "react";
import { logger } from "@/utils/logging";

interface UseErrorHandlerOptions {
  onError?: (error: Error) => void;
  logToSentry?: boolean;
}

export const useErrorHandler = (options: UseErrorHandlerOptions = {}) => {
  const { onError, logToSentry = true } = options;

  const handleError = useCallback(
    (error: Error, context?: Record<string, unknown>) => {
      // Log the error
      logger.error("Error caught by useErrorHandler", {
        error: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
      });

      // Send to Sentry if enabled
      if (
        logToSentry &&
        typeof window !== "undefined" &&
        "Sentry" in window &&
        typeof (
          window as {
            Sentry?: {
              captureException: (error: Error, options?: object) => void;
            };
          }
        ).Sentry?.captureException === "function"
      ) {
        (
          window as {
            Sentry: {
              captureException: (error: Error, options?: object) => void;
            };
          }
        ).Sentry.captureException(error, {
          contexts: { custom: context },
        });
      }

      // Call custom error handler if provided
      if (onError) {
        onError(error);
      }
    },
    [onError, logToSentry],
  );

  return { handleError };
};
