/**
 * Shared utilities for relationship hooks
 * Common error handling and state management functions
 */
import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("relationships");

export const createBaseActions = () => {
  const handleError = (error: unknown, operation: string): string => {
    const message = (error as Error).message;
    logger.error(`Failed to ${operation}`, { error });
    return message;
  };

  const clearError = (setState: (fn: (prev: any) => any) => void) => {
    setState((prev: any) => ({ ...prev, error: null }));
  };

  return { handleError, clearError };
};

export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  operationName: string,
  setState: (fn: (prev: any) => any) => void,
): Promise<T> => {
  setState((prev: any) => ({ ...prev, isLoading: true, error: null }));

  try {
    const result = await operation();
    return result;
  } catch (error) {
    const message = (error as Error).message;
    logger.error(`Failed to ${operationName}`, { error });
    setState((prev: any) => ({ ...prev, error: message }));
    throw error;
  } finally {
    setState((prev: any) => ({ ...prev, isLoading: false }));
  }
};
