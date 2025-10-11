/**
 * KeyholderErrorFallback
 * Feature-specific error fallback for the Keyholder Dashboard.
 */

import React from "react";
import { Button } from "@/components/ui";
import { FaLock, FaRedo } from "../../../utils/iconImport";

interface KeyholderErrorFallbackProps {
  error?: Error | null;
  resetError?: () => void;
}

export const KeyholderErrorFallback: React.FC<KeyholderErrorFallbackProps> = ({
  error,
  resetError,
}) => {
  // Provide user-friendly error messages based on error type
  const getErrorMessage = () => {
    if (!error) return "Unable to load keyholder features.";
    
    const message = error.message.toLowerCase();
    
    if (message.includes("permission") || message.includes("unauthorized")) {
      return "You don't have permission to access this feature. Please check your account status.";
    }
    if (message.includes("network") || message.includes("fetch")) {
      return "Network connection error. Please check your internet connection and try again.";
    }
    if (message.includes("timeout")) {
      return "The request timed out. Please try again.";
    }
    
    return "Unable to load keyholder features. Please try again.";
  };

  return (
    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6 my-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <FaLock className="w-8 h-8 text-purple-500" />
        </div>
        <div className="ml-4 flex-1">
          <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-300 mb-2">
            Keyholder Dashboard Error
          </h3>
          <p className="text-purple-700 dark:text-purple-400 mb-3">
            {getErrorMessage()}
          </p>
          {error && (
            <details className="mb-3">
              <summary className="text-sm text-purple-600 dark:text-purple-500 cursor-pointer hover:underline">
                Technical details
              </summary>
              <pre className="mt-2 text-xs text-purple-600 dark:text-purple-500 bg-purple-100 dark:bg-purple-950 p-2 rounded overflow-x-auto">
                {error.message}
              </pre>
            </details>
          )}
          {resetError && (
            <Button
              onClick={resetError}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
            >
              <FaRedo />
              Retry
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
