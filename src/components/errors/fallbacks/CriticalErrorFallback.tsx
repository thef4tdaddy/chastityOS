/**
 * CriticalErrorFallback
 * For unrecoverable errors that require page reload.
 */

import React from "react";

interface CriticalErrorFallbackProps {
  error: Error | null;
  resetError?: () => void;
}

export const CriticalErrorFallback: React.FC<CriticalErrorFallbackProps> = ({
  error,
}) => {
  const isDevelopment =
    import.meta.env.MODE === "development" ||
    import.meta.env.MODE === "nightly";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="max-w-md w-full bg-gray-800 border border-red-600 rounded-lg p-6 text-center">
        <div className="mb-4">
          <svg
            className="w-16 h-16 mx-auto text-red-500"
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
        <h1 className="text-2xl font-bold text-white mb-2">
          Something went wrong
        </h1>
        <p className="text-gray-300 mb-6">
          We're sorry, but something unexpected happened. Please reload the page
          to continue.
        </p>
        <Button
          onClick={() => window.location.reload()}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-md transition-colors w-full"
        >
          Reload Page
        </Button>
        {isDevelopment && error && (
          <div className="mt-6 text-left">
            <details className="bg-gray-700 rounded p-3">
              <summary className="text-red-400 cursor-pointer font-semibold mb-2">
                Error Details (Development Only)
              </summary>
              <pre className="text-xs text-gray-300 overflow-auto max-h-64">
                {error.stack || error.message}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
};
