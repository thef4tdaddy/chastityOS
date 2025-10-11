/**
 * ErrorDisplay
 * Inline error display for tracker operations with retry capability
 */

import React from "react";
import { Button } from "@/components/ui";
import { FaExclamationTriangle, FaTimes } from "../../utils/iconImport";

export interface ErrorDisplayProps {
  error: Error | string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  retryLabel?: string;
  className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
  retryLabel = "Retry",
  className = "",
}) => {
  if (!error) return null;

  const errorMessage = typeof error === "string" ? error : error.message;

  return (
    <div
      className={`bg-red-900/30 border border-red-500/50 rounded-lg p-3 sm:p-4 mb-4 ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <FaExclamationTriangle className="text-red-400 text-lg sm:text-xl flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm sm:text-base text-red-200 break-words">
            {errorMessage}
          </p>
        </div>
        {onDismiss && (
          <Button
            onClick={onDismiss}
            variant="ghost"
            className="text-red-400 hover:text-red-300 transition-colors flex-shrink-0 p-1"
            aria-label="Dismiss error"
          >
            <FaTimes className="text-base sm:text-lg" />
          </Button>
        )}
      </div>
      {onRetry && (
        <div className="mt-3 flex justify-end">
          <Button
            onClick={onRetry}
            variant="secondary"
            className="bg-red-600/50 hover:bg-red-600/70 text-white text-sm px-3 py-1.5 rounded transition-colors"
          >
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
