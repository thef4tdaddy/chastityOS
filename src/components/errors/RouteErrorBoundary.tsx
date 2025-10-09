/**
 * RouteErrorBoundary
 * Error boundaries for each major route to contain errors to specific pages.
 */

import React from "react";
import { logger } from "@/utils/logging";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  routeName?: string;
}

interface ErrorState {
  hasError: boolean;
  error: Error | null;
}

export class RouteErrorBoundary extends React.Component<Props, ErrorState> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    const { routeName } = this.props;

    logger.error(
      `Route Error Boundary caught error${routeName ? ` in ${routeName}` : ""}`,
      {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        route: routeName,
        timestamp: new Date().toISOString(),
      },
    );

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
          route: { name: routeName },
        },
      });
    }
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
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
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-red-800 mb-2">
              Oops! Something went wrong
            </h2>
            <p className="text-red-600 mb-4">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={this.handleReset}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
