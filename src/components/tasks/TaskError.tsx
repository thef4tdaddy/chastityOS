/**
 * TaskError Component
 * Display component for task-related errors with user-friendly messages
 */

import React from "react";
import { Button } from "@/components/ui";
import {
  FaExclamationTriangle,
  FaWifi,
  FaLock,
  FaFileUpload,
  FaBan,
} from "../../utils/iconImport";

export interface TaskErrorProps {
  error?: Error | null;
  errorType?:
    | "network"
    | "permission"
    | "upload"
    | "not-found"
    | "rate-limit"
    | "generic";
  title?: string;
  message?: string;
  onRetry?: () => void;
  showDetails?: boolean;
}

// Error type to icon mapping
const ERROR_ICONS = {
  network: FaWifi,
  permission: FaLock,
  upload: FaFileUpload,
  "not-found": FaBan,
  "rate-limit": FaExclamationTriangle,
  generic: FaExclamationTriangle,
};

// Error type to user-friendly messages
const ERROR_MESSAGES = {
  network:
    "Unable to connect to the server. Please check your internet connection and try again.",
  permission: "You don't have permission to perform this action.",
  upload:
    "Failed to upload file. Please check the file size and format, then try again.",
  "not-found": "The requested task could not be found.",
  "rate-limit":
    "Too many requests. Please wait a moment before trying again.",
  generic: "An unexpected error occurred. Please try again.",
};

// Detect error type from error object
function detectErrorType(
  error?: Error | null,
): TaskErrorProps["errorType"] {
  if (!error) return "generic";

  const message = error.message.toLowerCase();

  if (
    message.includes("network") ||
    message.includes("offline") ||
    message.includes("fetch failed") ||
    message.includes("failed to fetch")
  ) {
    return "network";
  }

  if (
    message.includes("permission") ||
    message.includes("unauthorized") ||
    message.includes("forbidden")
  ) {
    return "permission";
  }

  if (
    message.includes("upload") ||
    message.includes("file") ||
    message.includes("size")
  ) {
    return "upload";
  }

  if (message.includes("not found") || message.includes("404")) {
    return "not-found";
  }

  if (
    message.includes("rate limit") ||
    message.includes("too many requests") ||
    message.includes("429")
  ) {
    return "rate-limit";
  }

  return "generic";
}

export const TaskError: React.FC<TaskErrorProps> = ({
  error,
  errorType,
  title = "Task Error",
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
  const isOffline =
    typeof navigator !== "undefined" && !navigator.onLine;
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
          <h3 className="text-lg font-semibold text-red-300 mb-2">
            {title}
          </h3>
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
