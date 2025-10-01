/**
 * Shared utilities for relationship hooks
 * Common error handling and state management functions
 */
import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("relationships");

// Generic state shape that includes error handling
interface ErrorState {
  error: string | null;
}

interface LoadingState extends ErrorState {
  isLoading: boolean;
}

export const createBaseActions = () => {
  const handleError = (error: unknown, operation: string): string => {
    const message = (error as Error).message;
    logger.error(`Failed to ${operation}`, { error });
    return message;
  };

  const clearError = <T extends ErrorState>(
    setState: (fn: (prev: T) => T) => void,
  ) => {
    setState((prev: T) => ({ ...prev, error: null }));
  };

  return { handleError, clearError };
};

export const withErrorHandling = async <T, S extends LoadingState>(
  operation: () => Promise<T>,
  operationName: string,
  setState: (fn: (prev: S) => S) => void,
): Promise<T> => {
  setState((prev: S) => ({ ...prev, isLoading: true, error: null }));

  try {
    const result = await operation();
    return result;
  } catch (error) {
    const message = (error as Error).message;
    logger.error(`Failed to ${operationName}`, { error });
    setState((prev: S) => ({ ...prev, error: message }));
    throw error;
  } finally {
    setState((prev: S) => ({ ...prev, isLoading: false }));
  }
};

// Validation utilities
export const validateEmail = (email: string): string[] => {
  const errors: string[] = [];
  if (!email.trim()) {
    errors.push("Email is required");
  } else if (!/\S+@\S+\.\S+/.test(email)) {
    errors.push("Email format is invalid");
  }
  return errors;
};

export const validateRole = (role: string): string[] => {
  const errors: string[] = [];
  if (!role) {
    errors.push("Role is required");
  }
  return errors;
};

export const validateMessage = (message: string | undefined): string[] => {
  const errors: string[] = [];
  if (message && message.length > 500) {
    errors.push("Message cannot exceed 500 characters");
  }
  return errors;
};
