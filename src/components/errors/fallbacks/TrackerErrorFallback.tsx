/**
 * TrackerErrorFallback
 * Feature-specific error fallback for the Tracker page.
 */

import React from "react";
import { Button } from "@/components/ui";

interface TrackerErrorFallbackProps {
  error?: Error | null;
  resetError?: () => void;
}

export const TrackerErrorFallback: React.FC<TrackerErrorFallbackProps> = ({
  error,
  resetError,
}) => {
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
          <p className="text-yellow-700 mb-1">
            Unable to load tracker. Your data is safe.
          </p>
          {error && (
            <p className="text-sm text-yellow-600 mb-3">{error.message}</p>
          )}
          {resetError && (
            <Button
              onClick={resetError}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Retry
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
