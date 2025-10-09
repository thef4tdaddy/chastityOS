/**
 * Badge Component
 * Small status or label indicator
 */
import React from "react";

export interface BadgeProps {
  /**
   * Badge content
   */
  children: React.ReactNode;
  /**
   * Badge variant
   * @default 'default'
   */
  variant?:
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "error"
    | "warning"
    | "info";
  /**
   * Badge size
   * @default 'md'
   */
  size?: "sm" | "md" | "lg";
  /**
   * Badge style
   * @default 'solid'
   */
  style?: "solid" | "outline" | "subtle";
  /**
   * Show dot indicator
   */
  dot?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

// Size classes
const sizeClasses = {
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-2.5 py-0.5",
  lg: "text-base px-3 py-1",
};

// Variant classes for solid style
const solidVariantClasses = {
  default: "bg-gray-500 text-white",
  primary: "bg-tekhelet text-white",
  secondary: "bg-lavender_web text-dark_purple",
  success: "bg-green-500 text-white",
  error: "bg-red-500 text-white",
  warning: "bg-yellow-500 text-white",
  info: "bg-blue-500 text-white",
};

// Variant classes for outline style
const outlineVariantClasses = {
  default: "border-2 border-gray-500 text-gray-700 dark:text-gray-300",
  primary: "border-2 border-tekhelet text-tekhelet",
  secondary: "border-2 border-lavender_web text-lavender_web",
  success: "border-2 border-green-500 text-green-700 dark:text-green-400",
  error: "border-2 border-red-500 text-red-700 dark:text-red-400",
  warning: "border-2 border-yellow-500 text-yellow-700 dark:text-yellow-400",
  info: "border-2 border-blue-500 text-blue-700 dark:text-blue-400",
};

// Variant classes for subtle style
const subtleVariantClasses = {
  default: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300",
  primary: "bg-tekhelet/10 text-tekhelet",
  secondary: "bg-lavender_web/10 text-lavender_web",
  success:
    "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400",
  error: "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400",
  warning:
    "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400",
  info: "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400",
};

// Dot colors
const dotColors = {
  default: "bg-gray-500",
  primary: "bg-tekhelet",
  secondary: "bg-lavender_web",
  success: "bg-green-500",
  error: "bg-red-500",
  warning: "bg-yellow-500",
  info: "bg-blue-500",
};

/**
 * Badge Component
 *
 * Display small status indicators or labels.
 *
 * @example
 * ```tsx
 * <Badge variant="success">Active</Badge>
 *
 * <Badge variant="primary" size="lg">
 *   Premium
 * </Badge>
 *
 * <Badge variant="error" style="outline" dot>
 *   Error
 * </Badge>
 * ```
 */
export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  size = "md",
  style = "solid",
  dot = false,
  className = "",
}) => {
  const styleVariantMap = {
    solid: solidVariantClasses,
    outline: outlineVariantClasses,
    subtle: subtleVariantClasses,
  };

  const badgeClasses = `
    inline-flex
    items-center
    gap-1.5
    font-medium
    rounded-full
    whitespace-nowrap
    ${sizeClasses[size]}
    ${styleVariantMap[style][variant]}
    ${className}
  `
    .trim()
    .replace(/\s+/g, " ");

  return (
    <span className={badgeClasses}>
      {dot && (
        <span
          className={`w-2 h-2 rounded-full ${dotColors[variant]}`}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
};

Badge.displayName = "Badge";
