/**
 * RetryableErrorDisplay
 * A reusable component for displaying errors with retry functionality
 */

import React from "react";
import { Button } from "@/components/ui";
import { FaExclamationTriangle, FaRedo } from "../../../utils/iconImport";

interface RetryableErrorDisplayProps {
  error?: Error | null;
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
  showTechnicalDetails?: boolean;
}

export const RetryableErrorDisplay: React.FC<RetryableErrorDisplayProps> = ({
  error,
  title = "Something went wrong",
  message = "An error occurred while processing your request.",
  onRetry,
  className = "",
  showTechnicalDetails = false,
}) => {
  return (
    <div
      className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 my-4 ${className}`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <FaExclamationTriangle className="w-6 h-6 text-red-500" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">
            {title}
          </h3>
          <p className="text-sm text-red-700 dark:text-red-400 mb-2">
            {message}
          </p>
          {showTechnicalDetails && error && (
            <details className="mb-3">
              <summary className="text-xs text-red-600 dark:text-red-500 cursor-pointer hover:underline">
                Technical details
              </summary>
              <pre className="mt-2 text-xs text-red-600 dark:text-red-500 bg-red-100 dark:bg-red-950 p-2 rounded overflow-x-auto">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          )}
          {onRetry && (
            <Button
              onClick={onRetry}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-2"
            >
              <FaRedo className="w-3 h-3" />
              Retry
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
