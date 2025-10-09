/**
 * KeyholderErrorFallback
 * Feature-specific error fallback for the Keyholder Dashboard.
 */

import React from "react";

interface KeyholderErrorFallbackProps {
  error?: Error | null;
  resetError?: () => void;
}

export const KeyholderErrorFallback: React.FC<KeyholderErrorFallbackProps> = ({
  error,
  resetError,
}) => {
  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 my-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="w-8 h-8 text-purple-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <div className="ml-4 flex-1">
          <h3 className="text-lg font-semibold text-purple-800 mb-2">
            Keyholder Dashboard Error
          </h3>
          <p className="text-purple-700 mb-1">
            Unable to load keyholder features.
          </p>
          {error && (
            <p className="text-sm text-purple-600 mb-3">{error.message}</p>
          )}
          {resetError && (
            <button
              onClick={resetError}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
