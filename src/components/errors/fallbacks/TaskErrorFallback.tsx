/**
 * TaskErrorFallback
 * Feature-specific error fallback for task-related features.
 * Provides user-friendly error messages and retry functionality.
 */

import React from "react";
import { Button } from "@/components/ui";

interface TaskErrorFallbackProps {
  error?: Error | null;
  resetError?: () => void;
  context?: "loading" | "submission" | "upload" | "operation" | "network";
}

// Error type mapping
type ErrorType =
  | "network"
  | "permission"
  | "notfound"
  | "ratelimit"
  | "upload"
  | "submission"
  | "loading"
  | "default";

// Error message configurations
const ERROR_MESSAGES: Record<
  ErrorType,
  { title: string; message: string; actionable: string }
> = {
  network: {
    title: "Connection Issue",
    message:
      "Unable to connect to the server. Please check your internet connection.",
    actionable: "Make sure you're online and try again.",
  },
  permission: {
    title: "Permission Denied",
    message: "You don't have permission to perform this action.",
    actionable: "Contact your keyholder if you believe this is an error.",
  },
  notfound: {
    title: "Task Not Found",
    message: "The task you're looking for doesn't exist or has been deleted.",
    actionable: "Please refresh the page or return to the task list.",
  },
  ratelimit: {
    title: "Too Many Requests",
    message: "You're making requests too quickly.",
    actionable: "Please wait a moment and try again.",
  },
  upload: {
    title: "Upload Failed",
    message: "Failed to upload evidence file.",
    actionable: "Check your file size (max 5MB) and format, then try again.",
  },
  submission: {
    title: "Submission Failed",
    message: "Unable to submit your task for review.",
    actionable: "Please try again. If the problem persists, contact support.",
  },
  loading: {
    title: "Loading Error",
    message: "Unable to load tasks.",
    actionable: "Please refresh the page or try again later.",
  },
  default: {
    title: "Task Operation Failed",
    message: "An unexpected error occurred while processing your task.",
    actionable: "Please try again. If the issue persists, contact support.",
  },
};

// Detect error type from error message
const detectErrorType = (errorMessage: string, context?: string): ErrorType => {
  if (
    errorMessage.includes("network") ||
    errorMessage.includes("fetch") ||
    errorMessage.includes("offline")
  ) {
    return "network";
  }
  if (
    errorMessage.includes("permission") ||
    errorMessage.includes("unauthorized")
  ) {
    return "permission";
  }
  if (errorMessage.includes("not found") || errorMessage.includes("404")) {
    return "notfound";
  }
  if (
    errorMessage.includes("rate limit") ||
    errorMessage.includes("too many")
  ) {
    return "ratelimit";
  }
  if (context === "upload" || errorMessage.includes("upload")) {
    return "upload";
  }
  if (context === "submission" || errorMessage.includes("submit")) {
    return "submission";
  }
  if (context === "loading") {
    return "loading";
  }
  return "default";
};

// Error message mapping for better UX
const getErrorMessage = (
  error: Error | null | undefined,
  context?: string,
): { title: string; message: string; actionable: string } => {
  const errorMessage = error?.message?.toLowerCase() || "";
  const errorType = detectErrorType(errorMessage, context);
  const config = ERROR_MESSAGES[errorType];

  // Use actual error message for default case if available
  if (errorType === "default" && error?.message) {
    return { ...config, message: error.message };
  }

  return config;
};

export const TaskErrorFallback: React.FC<TaskErrorFallbackProps> = ({
  error,
  resetError,
  context,
}) => {
  const { title, message, actionable } = getErrorMessage(error, context);

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 my-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="w-8 h-8 text-orange-500"
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
          <h3 className="text-lg font-semibold text-orange-800 mb-2">
            {title}
          </h3>
          <p className="text-orange-700 mb-1">{message}</p>
          <p className="text-sm text-orange-600 mb-3">{actionable}</p>
          {resetError && (
            <Button
              onClick={resetError}
              variant="default"
              size="sm"
              className="bg-orange-600 hover:bg-orange-700"
            >
              Try Again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
