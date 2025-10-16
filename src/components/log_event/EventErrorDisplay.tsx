/**
 * EventErrorDisplay
 * Displays user-friendly error messages for event logging failures
 */

import React from "react";
import { FaExclamationCircle, FaTimes, FaRedo } from "../../utils/iconImport";
import { Button } from "@/components/ui";

export interface EventError {
  type: "validation" | "network" | "duplicate" | "timestamp" | "unknown";
  message: string;
  details?: string;
  canRetry?: boolean;
}

interface EventErrorDisplayProps {
  error: EventError | null;
  onDismiss?: () => void;
  onRetry?: () => void;
}

const getErrorIcon = (_type: EventError["type"]) => {
  return FaExclamationCircle;
};

const getErrorColor = (type: EventError["type"]) => {
  switch (type) {
    case "validation":
      return "yellow";
    case "network":
      return "orange";
    case "duplicate":
      return "blue";
    case "timestamp":
      return "purple";
    default:
      return "red";
  }
};

export const EventErrorDisplay: React.FC<EventErrorDisplayProps> = ({
  error,
  onDismiss,
  onRetry,
}) => {
  if (!error) return null;

  const color = getErrorColor(error.type);
  const IconComponent = getErrorIcon(error.type);

  return (
    <div
      className={`bg-${color}-950/30 border-2 border-${color}-400/20 rounded-lg p-3 sm:p-4 mb-4 animate-fade-in`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <IconComponent
          className={`text-${color}-400 text-lg sm:text-xl flex-shrink-0 mt-0.5`}
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          <h4
            className={`text-sm sm:text-base font-semibold text-${color}-300 mb-1`}
          >
            {error.message}
          </h4>
          {error.details && (
            <p
              className={`text-xs sm:text-sm text-${color}-200/70 break-words`}
            >
              {error.details}
            </p>
          )}
          {(error.canRetry || onRetry) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {onRetry && (
                <Button
                  onClick={onRetry}
                  size="sm"
                  className={`bg-${color}-500 hover:bg-${color}-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5`}
                >
                  <FaRedo className="text-xs" />
                  Retry
                </Button>
              )}
            </div>
          )}
        </div>
        {onDismiss && (
          <Button
            onClick={onDismiss}
            size="sm"
            className={`text-${color}-400 hover:text-${color}-300 transition-colors flex-shrink-0 p-1`}
            aria-label="Dismiss error"
          >
            <FaTimes className="text-base sm:text-lg" />
          </Button>
        )}
      </div>
    </div>
  );
};

/**
 * Helper function to create standardized error objects
 */
export const createEventError = (
  type: EventError["type"],
  message: string,
  details?: string,
  canRetry = true,
): EventError => ({
  type,
  message,
  details,
  canRetry,
});

/**
 * Common error messages for event operations
 */
export const EVENT_ERROR_MESSAGES = {
  VALIDATION_REQUIRED_FIELDS: "Please fill in all required fields",
  VALIDATION_INVALID_DATE: "Please enter a valid date and time",
  VALIDATION_FUTURE_DATE: "Event date cannot be in the future",
  VALIDATION_DUPLICATE:
    "A similar event already exists at this time. Are you sure you want to create a duplicate?",
  NETWORK_OFFLINE:
    "You are currently offline. Event will be synced when online",
  NETWORK_TIMEOUT: "The request timed out. Please check your connection",
  NETWORK_ERROR: "Failed to save event. Please try again",
  TIMESTAMP_INVALID: "The timestamp format is invalid",
  TIMESTAMP_CONFLICT: "An event already exists at this exact time",
  UNKNOWN_ERROR: "An unexpected error occurred. Please try again",
} as const;
