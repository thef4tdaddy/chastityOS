/**
 * ErrorFallback
 * Generic error fallback for recoverable errors with retry functionality.
 */

import React from "react";
import { Button } from "@/components/ui";

interface ErrorFallbackProps {
  error: Error | null;
  resetError?: () => void;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
}) => {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="mb-4">
          <svg
            className="w-12 h-12 mx-auto text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-red-800 mb-2">
          Oops! Something went wrong
        </h2>
        <p className="text-red-600 mb-4">
          {error?.message || "An unexpected error occurred"}
        </p>
        {resetError && (
          <Button
            onClick={resetError}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded-md transition-colors"
          >
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
};
