/**
 * TrackerErrorFallback
 * Feature-specific error fallback for the Tracker page.
 * Provides contextual error messages and recovery options.
 */

import React from "react";
import { Button } from "@/components/ui";

interface TrackerErrorFallbackProps {
  error?: Error | null;
  resetError?: () => void;
}

interface ErrorCategory {
  category: string;
  userMessage: string;
  recoveryHints: string[];
}

// Network error matcher
const matchNetworkError = (message: string): ErrorCategory | null => {
  if (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("timeout")
  ) {
    return {
      category: "network",
      userMessage:
        "Network connection issue. Please check your internet connection.",
      recoveryHints: [
        "Check your internet connection",
        "Try refreshing the page",
        "Your session data is safely stored locally",
      ],
    };
  }
  return null;
};

// Session conflict error matcher
const matchConflictError = (message: string): ErrorCategory | null => {
  if (
    message.includes("conflict") ||
    message.includes("already active") ||
    message.includes("concurrent")
  ) {
    return {
      category: "conflict",
      userMessage:
        "Session conflict detected. Another device may have modified your session.",
      recoveryHints: [
        "Close other tabs/devices",
        "Refresh to sync latest state",
        "Contact support if issue persists",
      ],
    };
  }
  return null;
};

// Permission error matcher
const matchPermissionError = (message: string): ErrorCategory | null => {
  if (
    message.includes("permission") ||
    message.includes("unauthorized") ||
    message.includes("forbidden")
  ) {
    return {
      category: "permission",
      userMessage:
        "Permission denied. You may not have access to this operation.",
      recoveryHints: [
        "Check your keyholder permissions",
        "Try logging out and back in",
        "Contact your keyholder if needed",
      ],
    };
  }
  return null;
};

// Timer/sync error matcher
const matchSyncError = (message: string): ErrorCategory | null => {
  if (
    message.includes("timer") ||
    message.includes("sync") ||
    message.includes("time")
  ) {
    return {
      category: "sync",
      userMessage: "Timer synchronization issue detected.",
      recoveryHints: [
        "Check your device's time settings",
        "Ensure time zone is correct",
        "Try refreshing the page",
      ],
    };
  }
  return null;
};

// Error categorization helper
const categorizeError = (error: Error | null | undefined): ErrorCategory => {
  const message = error?.message?.toLowerCase() || "";

  // Try each matcher in order
  return (
    matchNetworkError(message) ||
    matchConflictError(message) ||
    matchPermissionError(message) ||
    matchSyncError(message) || {
      category: "unknown",
      userMessage: "An unexpected error occurred. Your data is safe.",
      recoveryHints: [
        "Try refreshing the page",
        "Clear browser cache if problem persists",
        "Contact support with error details",
      ],
    }
  );
};

export const TrackerErrorFallback: React.FC<TrackerErrorFallbackProps> = ({
  error,
  resetError,
}) => {
  const { userMessage, recoveryHints } = categorizeError(error);

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 my-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="w-8 h-8 text-yellow-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div className="ml-4 flex-1">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            Tracker Error
          </h3>
          <p className="text-yellow-700 mb-2">{userMessage}</p>

          {/* Technical error details */}
          {error && (
            <details className="text-xs text-yellow-600 mb-3 cursor-pointer">
              <summary className="hover:underline">Technical details</summary>
              <code className="block mt-1 p-2 bg-yellow-100 rounded">
                {error.message}
              </code>
            </details>
          )}

          {/* Recovery hints */}
          {recoveryHints.length > 0 && (
            <div className="mb-3">
              <p className="text-sm font-medium text-yellow-800 mb-1">
                What you can do:
              </p>
              <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
                {recoveryHints.map((hint, index) => (
                  <li key={index}>{hint}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Action buttons */}
          {resetError && (
            <div className="flex gap-2">
              <Button
                onClick={resetError}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Retry
              </Button>
              <Button
                onClick={() => window.location.reload()}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Refresh Page
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
