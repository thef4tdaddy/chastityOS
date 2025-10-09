/**
 * ErrorState Component
 * Display when an error occurs
 */
import React from "react";

export interface ErrorStateProps {
  /**
   * Error title
   * @default 'Something went wrong'
   */
  title?: string;
  /**
   * Error message
   */
  message?: string;
  /**
   * Error object (for development)
   */
  error?: Error;
  /**
   * Retry action button
   */
  onRetry?: () => void;
  /**
   * Reset/go back action
   */
  onReset?: () => void;
  /**
   * Show error details (stack trace)
   * @default false
   */
  showDetails?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Error Icon
 */
const ErrorIcon: React.FC = () => (
  <svg
    className="w-16 h-16 text-red-500"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
    />
  </svg>
);

/**
 * ErrorState Component
 *
 * Display an error state with retry and reset options.
 *
 * @example
 * ```tsx
 * <ErrorState
 *   title="Failed to load data"
 *   message="Unable to fetch your data. Please try again."
 *   onRetry={handleRetry}
 * />
 *
 * <ErrorState
 *   error={error}
 *   showDetails={process.env.NODE_ENV === 'development'}
 *   onRetry={refetch}
 *   onReset={() => navigate('/')}
 * />
 * ```
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  message,
  error,
  onRetry,
  onReset,
  showDetails = false,
  className = "",
}) => {
  const [detailsExpanded, setDetailsExpanded] = React.useState(false);

  const displayMessage =
    message || error?.message || "An unexpected error occurred.";

  return (
    <div
      className={`
        flex
        flex-col
        items-center
        justify-center
        text-center
        py-12
        px-4
        ${className}
      `
        .trim()
        .replace(/\s+/g, " ")}
      role="alert"
    >
      {/* Icon */}
      <div className="mb-4">
        <ErrorIcon />
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>

      {/* Message */}
      <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mb-6">
        {displayMessage}
      </p>

      {/* Actions */}
      {(onRetry || onReset) && (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {onRetry && (
            <button
              onClick={onRetry}
              className="
                inline-flex
                items-center
                justify-center
                px-4
                py-2
                border
                border-transparent
                rounded-lg
                shadow-sm
                text-sm
                font-medium
                text-white
                bg-tekhelet
                hover:bg-tekhelet-600
                focus:outline-none
                focus:ring-2
                focus:ring-offset-2
                focus:ring-purple-500
              "
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Try Again
            </button>
          )}
          {onReset && (
            <button
              onClick={onReset}
              className="
                inline-flex
                items-center
                justify-center
                px-4
                py-2
                border
                border-gray-300
                dark:border-gray-600
                rounded-lg
                shadow-sm
                text-sm
                font-medium
                text-gray-700
                dark:text-gray-300
                bg-white
                dark:bg-gray-800
                hover:bg-gray-50
                dark:hover:bg-gray-700
                focus:outline-none
                focus:ring-2
                focus:ring-offset-2
                focus:ring-purple-500
              "
            >
              Go Back
            </button>
          )}
        </div>
      )}

      {/* Error Details (Development) */}
      {showDetails && error && (
        <div className="w-full max-w-2xl">
          <button
            onClick={() => setDetailsExpanded(!detailsExpanded)}
            className="
              text-sm
              text-gray-600
              dark:text-gray-400
              hover:text-gray-800
              dark:hover:text-gray-200
              underline
              mb-2
            "
          >
            {detailsExpanded ? "Hide" : "Show"} error details
          </button>
          {detailsExpanded && (
            <pre
              className="
                mt-2
                p-4
                bg-gray-100
                dark:bg-gray-800
                border
                border-gray-300
                dark:border-gray-700
                rounded-lg
                text-left
                text-xs
                overflow-auto
                max-h-64
              "
            >
              {error.stack || error.toString()}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

ErrorState.displayName = "ErrorState";
