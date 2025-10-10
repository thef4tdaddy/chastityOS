/**
 * LoadingState Component
 * Standardized loading state with spinner and optional message
 */
import React from "react";
import { Spinner, SpinnerProps } from "./Spinner";

export interface LoadingStateProps {
  /**
   * Loading message to display
   */
  message?: string;
  /**
   * Size of the spinner
   * @default 'md'
   */
  size?: SpinnerProps["size"];
  /**
   * Full-screen loading overlay
   * @default false
   */
  fullScreen?: boolean;
  /**
   * Overlay mode with dimmed background
   * @default false
   */
  overlay?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Spinner color
   * @default 'primary'
   */
  color?: SpinnerProps["color"];
  /**
   * Additional content to render below the spinner and message
   */
  children?: React.ReactNode;
}

/**
 * LoadingState Component
 *
 * A standardized loading state component that combines a spinner with an optional message.
 * Supports inline, page-level, and full-screen overlay modes.
 *
 * @example
 * ```tsx
 * // Inline loading
 * <LoadingState message="Loading..." />
 *
 * // Page loading
 * <LoadingState message="Loading report..." size="lg" />
 *
 * // Full-screen loading
 * <LoadingState message="Loading session..." fullScreen />
 *
 * // Overlay loading
 * <LoadingState message="Saving changes..." overlay />
 * ```
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  message,
  size = "md",
  fullScreen = false,
  overlay = false,
  className = "",
  color = "primary",
  children,
}) => {
  // Determine spinner size based on mode
  const spinnerSize = fullScreen ? "xl" : size;

  // Base content
  const content = (
    <div className="text-center">
      <Spinner size={spinnerSize} color={color} className="mx-auto mb-4" />
      {message && (
        <div className="text-sm md:text-base text-gray-300">{message}</div>
      )}
      {children}
    </div>
  );

  // Full-screen mode
  if (fullScreen) {
    return (
      <div
        className={`fixed inset-0 bg-gray-900 flex items-center justify-center p-4 z-50 ${className}`}
      >
        {content}
      </div>
    );
  }

  // Overlay mode
  if (overlay) {
    return (
      <div
        className={`fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 ${className}`}
      >
        {content}
      </div>
    );
  }

  // Inline mode
  return <div className={`py-8 ${className}`}>{content}</div>;
};

LoadingState.displayName = "LoadingState";
