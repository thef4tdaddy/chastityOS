/**
 * TaskErrorBoundary
 * Error boundary specifically for task-related components.
 * Catches and handles errors in task features with appropriate fallback UI.
 */

import React from "react";
import { logger } from "@/utils/logging";
import { TaskErrorFallback } from "../errors/fallbacks/TaskErrorFallback";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  context?: "loading" | "submission" | "upload" | "operation" | "network";
}

interface ErrorState {
  hasError: boolean;
  error: Error | null;
}

export class TaskErrorBoundary extends React.Component<Props, ErrorState> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    const { context } = this.props;

    logger.error("Task Error Boundary caught error", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      context: context || "unknown",
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
          task: { context: context || "unknown" },
        },
        tags: {
          feature: "tasks",
          context: context || "unknown",
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
                context?: string;
              }>,
              {
                error: this.state.error,
                resetError: this.handleReset,
                context: this.props.context,
              },
            )
          : this.props.fallback;
      }

      // Default to TaskErrorFallback
      return (
        <TaskErrorFallback
          error={this.state.error}
          resetError={this.handleReset}
          context={this.props.context}
        />
      );
    }

    return this.props.children;
  }
}
