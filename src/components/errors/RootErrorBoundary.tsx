/**
 * RootErrorBoundary
 * Top-level error boundary that catches all unhandled errors in the application.
 */

import React from "react";
import { logger } from "@/utils/logging";
import { CriticalErrorFallback } from "./fallbacks/CriticalErrorFallback";

interface Props {
  children: React.ReactNode;
}

interface ErrorState {
  hasError: boolean;
  error: Error | null;
}

export class RootErrorBoundary extends React.Component<Props, ErrorState> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log to error reporting service (Sentry, etc.)
    logger.error("Root Error Boundary caught error", {
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
        contexts: { react: errorInfo },
      });
    }
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return <CriticalErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
