/**
 * LoadingState Component
 * Standardized loading state component combining spinner with optional message
 */
import React from "react";
import { Spinner } from "./Spinner";

export interface LoadingStateProps {
  /**
   * Loading message to display
   * @default 'Loading...'
   */
  message?: string;
  /**
   * Size variant matching Spinner sizes
   * @default 'md'
   */
  size?: "sm" | "md" | "lg";
  /**
   * Full-screen loading mode (fixed overlay covering entire viewport)
   * @default false
   */
  fullScreen?: boolean;
  /**
   * Overlay mode (dims background, centered in container)
   * @default false
   */
  overlay?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

// Size-specific configurations for text and spacing
const sizeConfig = {
  sm: {
    spinnerSize: "sm" as const,
    textClass: "text-sm",
    spacing: "gap-2",
  },
  md: {
    spinnerSize: "md" as const,
    textClass: "text-base",
    spacing: "gap-3",
  },
  lg: {
    spinnerSize: "lg" as const,
    textClass: "text-lg",
    spacing: "gap-4",
  },
};

/**
 * LoadingState Component
 *
 * A standardized loading state component that combines a spinner with optional loading text.
 * Supports inline, overlay, and full-screen loading modes.
 *
 * @example
 * ```tsx
 * // Inline loading
 * <LoadingState message="Loading data..." />
 *
 * // Full-screen loading
 * <LoadingState message="Loading application..." fullScreen />
 *
 * // Overlay loading for async operations
 * <LoadingState message="Saving..." overlay />
 *
 * // Small inline loader
 * <LoadingState size="sm" />
 * ```
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading...",
  size = "md",
  fullScreen = false,
  overlay = false,
  className = "",
}) => {
  const config = sizeConfig[size];

  // Content: Spinner + Message
  const content = (
    <div
      className={`flex flex-col items-center justify-center ${config.spacing}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Spinner size={config.spinnerSize} />
      {message && (
        <p className={`${config.textClass} text-gray-300`}>{message}</p>
      )}
    </div>
  );

  // Full-screen mode: fixed overlay covering entire viewport
  if (fullScreen) {
    return (
      <div
        className={`fixed inset-0 bg-gray-900 flex items-center justify-center z-50 ${className}`}
      >
        {content}
      </div>
    );
  }

  // Overlay mode: absolute overlay within container with dimmed background
  if (overlay) {
    return (
      <div
        className={`absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 ${className}`}
      >
        {content}
      </div>
    );
  }

  // Inline mode: centered within container
  return (
    <div className={`flex items-center justify-center py-8 ${className}`}>
      {content}
    </div>
  );
};

LoadingState.displayName = "LoadingState";
