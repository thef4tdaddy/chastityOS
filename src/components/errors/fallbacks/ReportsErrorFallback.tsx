/**
 * ReportsErrorFallback
 * Feature-specific error fallback for Full Report components
 */

import React from "react";
import { Button } from "@/components/ui";
import {
  FaExclamationTriangle,
  FaRedo,
  FaChartBar,
} from "../../../utils/iconImport";

interface ReportsErrorFallbackProps {
  error?: Error | null;
  resetError?: () => void;
  feature?: string;
}

export const ReportsErrorFallback: React.FC<ReportsErrorFallbackProps> = ({
  error,
  resetError,
  feature = "Report",
}) => {
  return (
    <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 sm:p-6 my-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <FaExclamationTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <FaChartBar className="text-red-400" />
            <h3 className="text-base sm:text-lg font-semibold text-red-300">
              {feature} Error
            </h3>
          </div>
          <p className="text-sm sm:text-base text-red-400 mb-3 break-words">
            We encountered an error while loading your report data. Your data is
            safe and has not been affected.
          </p>
          {error?.message && (
            <p className="text-xs sm:text-sm text-red-500 mb-3 font-mono bg-red-950/50 p-2 rounded break-all">
              {error.message}
            </p>
          )}
          <div className="space-y-2">
            {resetError && (
              <Button
                onClick={resetError}
                className="bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2"
              >
                <FaRedo className="w-3 h-3" />
                Retry Loading
              </Button>
            )}
            <p className="text-xs text-red-400/70">
              If this problem persists, try refreshing the page or contact
              support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
