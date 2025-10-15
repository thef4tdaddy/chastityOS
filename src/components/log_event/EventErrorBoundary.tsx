/**
 * EventErrorBoundary
 * Error boundary specifically for event logging and display features
 */

import React from "react";
import { Button, Card } from "@/components/ui";
import { logger } from "@/utils/logging";
import { FaExclamationTriangle, FaRedo } from "../../utils/iconImport";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class EventErrorBoundary extends React.Component<Props, ErrorState> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    logger.error("Event Error Boundary caught error", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });

    this.setState({ errorInfo });

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
          feature: { name: "Events/Logging" },
        },
      });
    }
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
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

      // Default fallback with user-friendly error display
      return (
        <Card
          variant="glass"
          className="p-4 sm:p-6 my-4 border-2 border-red-400/20 bg-red-950/20"
        >
          <div className="flex items-start gap-3 sm:gap-4">
            <FaExclamationTriangle className="text-red-400 text-xl sm:text-2xl flex-shrink-0 mt-1" />
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-red-300 mb-2">
                Event Feature Error
              </h3>
              <p className="text-sm sm:text-base text-red-200/80 mb-4">
                {this.state.error?.message ||
                  "An unexpected error occurred while loading the event feature. Please try again."}
              </p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button
                  onClick={this.handleReset}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <FaRedo className="text-sm" />
                  Retry
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="ghost"
                  className="border border-red-400/30 text-red-300 hover:bg-red-950/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Reload Page
                </Button>
              </div>
              {process.env.NODE_ENV === "development" &&
                this.state.errorInfo && (
                  <details className="mt-4 text-xs text-red-200/60">
                    <summary className="cursor-pointer hover:text-red-200">
                      Error Details (Development)
                    </summary>
                    <pre className="mt-2 p-2 bg-black/30 rounded overflow-auto max-h-48">
                      {this.state.error?.stack}
                    </pre>
                  </details>
                )}
            </div>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}
