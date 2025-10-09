/**
 * Progress Component
 * Display progress indicator
 */
import React from "react";

export interface ProgressProps {
  /**
   * Progress value (0-100)
   */
  value: number;
  /**
   * Maximum value
   * @default 100
   */
  max?: number;
  /**
   * Progress bar size
   * @default 'md'
   */
  size?: "sm" | "md" | "lg";
  /**
   * Progress bar variant
   * @default 'primary'
   */
  variant?: "primary" | "secondary" | "success" | "error" | "warning";
  /**
   * Show percentage label
   * @default false
   */
  showLabel?: boolean;
  /**
   * Label position
   * @default 'inside'
   */
  labelPosition?: "inside" | "top" | "bottom";
  /**
   * Custom label text
   */
  label?: string;
  /**
   * Indeterminate progress (loading state)
   * @default false
   */
  indeterminate?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

// Size classes
const sizeClasses = {
  sm: "h-1",
  md: "h-2",
  lg: "h-3",
};

// Variant classes
const variantClasses = {
  primary: "bg-tekhelet",
  secondary: "bg-lavender_web",
  success: "bg-green-500",
  error: "bg-red-500",
  warning: "bg-yellow-500",
};

/**
 * Progress Component
 *
 * Display progress indicators for tasks and operations.
 *
 * @example
 * ```tsx
 * <Progress value={75} />
 *
 * <Progress value={50} variant="success" showLabel />
 *
 * <Progress value={60} size="lg" label="Uploading..." labelPosition="top" />
 *
 * <Progress indeterminate />
 * ```
 */
export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  size = "md",
  variant = "primary",
  showLabel = false,
  labelPosition = "inside",
  label,
  indeterminate = false,
  className = "",
}) => {
  // Calculate percentage
  const percentage = indeterminate
    ? 0
    : Math.min(100, Math.max(0, (value / max) * 100));

  // Label text
  const labelText = label || `${Math.round(percentage)}%`;

  return (
    <div className={`w-full ${className}`}>
      {/* Top Label */}
      {showLabel && labelPosition === "top" && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {labelText}
          </span>
        </div>
      )}

      {/* Progress Bar */}
      <div
        className={`
          w-full
          ${sizeClasses[size]}
          bg-gray-200
          dark:bg-gray-700
          rounded-full
          overflow-hidden
          relative
        `
          .trim()
          .replace(/\s+/g, " ")}
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        <div
          className={`
            h-full
            ${variantClasses[variant]}
            rounded-full
            transition-all
            duration-300
            ease-in-out
            ${indeterminate ? "animate-pulse" : ""}
          `
            .trim()
            .replace(/\s+/g, " ")}
          style={{
            width: indeterminate ? "100%" : `${percentage}%`,
          }}
        >
          {/* Inside Label */}
          {showLabel && labelPosition === "inside" && percentage > 20 && (
            <div className="flex items-center justify-center h-full">
              <span className="text-xs font-medium text-white px-2">
                {labelText}
              </span>
            </div>
          )}
        </div>

        {/* Indeterminate animation */}
        {indeterminate && (
          <div
            className={`
              absolute
              inset-0
              ${variantClasses[variant]}
              animate-shimmer
              bg-gradient-to-r
              from-transparent
              via-white/30
              to-transparent
            `
              .trim()
              .replace(/\s+/g, " ")}
            style={{
              backgroundSize: "200% 100%",
              animation: "shimmer 2s infinite",
            }}
          />
        )}
      </div>

      {/* Bottom Label */}
      {showLabel && labelPosition === "bottom" && (
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {labelText}
          </span>
        </div>
      )}
    </div>
  );
};

Progress.displayName = "Progress";
