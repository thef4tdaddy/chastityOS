/**
 * FeatureErrorBoundary
 * Granular error boundaries for complex features/components.
 */

import React from "react";
import { logger } from "@/utils/logging";

interface Props {
  children: React.ReactNode;
  feature: string;
  fallback?: React.ReactNode;
}

interface ErrorState {
  hasError: boolean;
  error: Error | null;
}

export class FeatureErrorBoundary extends React.Component<Props, ErrorState> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    const { feature } = this.props;

    logger.error(`Feature Error Boundary caught error in ${feature}`, {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      feature,
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
          feature: { name: feature },
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
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 my-4">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            Feature Error: {this.props.feature}
          </h3>
          <p className="text-yellow-600 mb-3">
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          <Button
            onClick={this.handleReset}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            Retry
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
