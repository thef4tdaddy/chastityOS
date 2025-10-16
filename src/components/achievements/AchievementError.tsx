/**
 * AchievementError Component
 * Display component for achievement-related errors with user-friendly messages
 */

import React from "react";
import { Button } from "@/components/ui";
import {
  FaExclamationTriangle,
  FaWifi,
  FaLock,
  FaBan,
  FaTrophy,
} from "@/utils/iconImport";

type HandledErrorType =
  | "network"
  | "permission"
  | "data-load"
  | "calculation"
  | "unlock"
  | "progress"
  | "not-found"
  | "rate-limit"
  | "generic";

export interface AchievementErrorProps {
  error?: Error | null;
  errorType?: HandledErrorType;
  title?: string;
  message?: string;
  onRetry?: () => void;
  showDetails?: boolean;
}

// Error type to icon mapping
const ERROR_ICONS = {
  network: FaWifi,
  permission: FaLock,
  "data-load": FaTrophy,
  calculation: FaExclamationTriangle,
  unlock: FaTrophy,
  progress: FaExclamationTriangle,
  "not-found": FaBan,
  "rate-limit": FaExclamationTriangle,
  generic: FaExclamationTriangle,
};

// Error type to user-friendly messages
const ERROR_MESSAGES = {
  network:
    "Unable to load achievements. Please check your internet connection and try again.",
  permission: "You don't have permission to access these achievements.",
  "data-load":
    "Failed to load achievement data. This might be a temporary issue.",
  calculation:
    "Unable to calculate achievement progress. Please try refreshing the page.",
  unlock:
    "Failed to unlock achievement. Your progress has been saved and will sync when possible.",
  progress:
    "Unable to update achievement progress. Please try again in a moment.",
  "not-found": "The requested achievement could not be found.",
  "rate-limit": "Too many requests. Please wait a moment before trying again.",
  generic:
    "An unexpected error occurred while loading achievements. Please try again.",
};

// Error pattern mappings for detection
const ERROR_PATTERNS = {
  network: ["network", "offline", "fetch failed", "failed to fetch"],
  permission: ["permission", "unauthorized", "forbidden"],
  "data-load": ["load", "loading", "fetch"],
  calculation: ["calculation", "calculate", "NaN", "infinity"],
  unlock: ["unlock", "award"],
  progress: ["progress", "update"],
  "not-found": ["not found", "404", "missing"],
  "rate-limit": ["rate limit", "too many requests", "429"],
} as const;

// Detect error type from error object
function detectErrorType(error?: Error | null): HandledErrorType {
  if (!error) return "generic";

  const message = error.message.toLowerCase();

  // Check each error pattern
  for (const [type, patterns] of Object.entries(ERROR_PATTERNS)) {
    if (patterns.some((pattern) => message.includes(pattern))) {
      return type as HandledErrorType;
    }
  }

  return "generic";
}

export const AchievementError: React.FC<AchievementErrorProps> = ({
  error,
  errorType,
  title = "Achievement Error",
  message,
  onRetry,
  showDetails = false,
}) => {
  // Auto-detect error type if not provided
  const detectedType = errorType || detectErrorType(error);
  const Icon = ERROR_ICONS[detectedType];
  const defaultMessage = ERROR_MESSAGES[detectedType];

  // Use custom message or default message
  const displayMessage = message || defaultMessage;

  // Check if offline
  const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
  const finalMessage = isOffline
    ? "You appear to be offline. Please check your internet connection."
    : displayMessage;

  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 my-4">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <Icon className="text-red-400 text-3xl" />
        </div>
        <div className="flex-grow">
          <h3 className="text-lg font-semibold text-red-300 mb-2">{title}</h3>
          <p className="text-red-200 mb-4">{finalMessage}</p>

          {showDetails && error && (
            <details className="mb-4">
              <summary className="text-sm text-red-300 cursor-pointer hover:text-red-200 mb-2">
                Technical Details
              </summary>
              <div className="bg-black/30 rounded p-3 text-xs font-mono text-red-100">
                <div className="mb-2">
                  <strong>Error:</strong> {error.message}
                </div>
                {error.stack && (
                  <div className="text-red-200/70 whitespace-pre-wrap break-all">
                    {error.stack}
                  </div>
                )}
              </div>
            </details>
          )}

          <div className="flex gap-3">
            {onRetry && (
              <Button
                onClick={onRetry}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-medium transition-colors"
              >
                Try Again
              </Button>
            )}

            {detectedType === "network" && (
              <Button
                onClick={() => window.location.reload()}
                className="bg-white/10 hover:bg-white/20 text-red-200 px-4 py-2 rounded font-medium transition-colors"
              >
                Refresh Page
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
