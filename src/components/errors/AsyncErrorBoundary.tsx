/**
 * AsyncErrorBoundary
 * Error boundaries specifically for React.Suspense async operations.
 */

import React from "react";
import { logger } from "@/utils/logging";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onReset?: () => void;
}

interface ErrorState {
  hasError: boolean;
  error: Error | null;
}

export class AsyncErrorBoundary extends React.Component<Props, ErrorState> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    logger.error("Async Error Boundary caught error", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });

    // Send to Sentry if available
    if (
      typeof window !== "undefined" &&
      "Sentry" in window &&
      typeof (
        window as {
          Sentry?: {
            captureException: (error: Error, options?: object) => void;
          };
        }
      ).Sentry?.captureException === "function"
    ) {
      (
        window as {
          Sentry: {
            captureException: (error: Error, options?: object) => void;
          };
        }
      ).Sentry.captureException(error, {
        contexts: {
          react: errorInfo,
          async: true,
        },
      });
    }
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        // Clone the fallback element and pass error and reset handler
        return React.isValidElement(this.props.fallback)
          ? React.cloneElement(
              this.props.fallback as React.ReactElement<{
                error?: Error | null;
                resetError?: () => void;
              }>,
              {
                error: this.state.error,
                resetError: this.handleReset,
              },
            )
          : this.props.fallback;
      }

      // Default fallback
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            Loading Error
          </h3>
          <p className="text-blue-600 mb-3">
            {this.state.error?.message || "Failed to load content"}
          </p>
          <button
            onClick={this.handleReset}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
