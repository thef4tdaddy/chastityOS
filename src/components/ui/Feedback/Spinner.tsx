/**
 * Spinner Component
 * Loading spinner indicator
 */
import React from "react";

export interface SpinnerProps {
  /**
   * Spinner size
   * @default 'md'
   */
  size?: "sm" | "md" | "lg" | "xl";
  /**
   * Spinner color
   * @default 'primary'
   */
  color?: "primary" | "secondary" | "white" | "current";
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Accessible label for screen readers
   * @default 'Loading...'
   */
  label?: string;
}

// Size configurations
const sizeClasses = {
  sm: "w-4 h-4 border-2",
  md: "w-6 h-6 border-2",
  lg: "w-8 h-8 border-3",
  xl: "w-12 h-12 border-4",
};

// Color configurations
const colorClasses = {
  primary: "border-tekhelet border-t-transparent",
  secondary: "border-lavender_web border-t-transparent",
  white: "border-white border-t-transparent",
  current: "border-current border-t-transparent",
};

/**
 * Spinner Component
 *
 * A loading spinner with various sizes and colors.
 *
 * @example
 * ```tsx
 * <Spinner size="md" />
 *
 * <Spinner size="lg" color="primary" />
 *
 * <Button loading>
 *   <Spinner size="sm" color="white" />
 *   Loading...
 * </Button>
 * ```
 */
export const Spinner: React.FC<SpinnerProps> = ({
  size = "md",
  color = "primary",
  className = "",
  label = "Loading...",
}) => {
  return (
    <div
      role="status"
      aria-label={label}
      className={`inline-block ${className}`}
    >
      <div
        className={`
          ${sizeClasses[size]}
          ${colorClasses[color]}
          rounded-full
          animate-spin
        `
          .trim()
          .replace(/\s+/g, " ")}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
};

Spinner.displayName = "Spinner";
