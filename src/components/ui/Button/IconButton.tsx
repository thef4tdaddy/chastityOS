/**
 * IconButton Component
 * Button component that displays only an icon
 */
import React, { forwardRef } from "react";

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual style variant
   * @default 'ghost'
   */
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  /**
   * Button size
   * @default 'md'
   */
  size?: "sm" | "md" | "lg";
  /**
   * Icon to display
   */
  icon: React.ReactNode;
  /**
   * Accessible label for screen readers
   */
  "aria-label": string;
}

// Size configurations (square buttons)
const sizeClasses = {
  sm: "h-8 w-8 p-1",
  md: "h-10 w-10 p-2",
  lg: "h-12 w-12 p-2.5",
};

// Variant configurations
const variantClasses = {
  primary: `
    bg-tekhelet hover:bg-tekhelet-600 active:bg-tekhelet-700
    text-white border-2 border-tekhelet
    shadow-md hover:shadow-lg active:shadow-sm
  `,
  secondary: `
    bg-lavender_web hover:bg-lavender_web-600 active:bg-lavender_web-700
    text-dark_purple border-2 border-lavender_web
    shadow-md hover:shadow-lg active:shadow-sm
  `,
  danger: `
    bg-red-500 hover:bg-red-600 active:bg-red-700
    text-white border-2 border-red-500
    shadow-md hover:shadow-lg active:shadow-sm
  `,
  outline: `
    bg-transparent hover:bg-tekhelet/10 active:bg-tekhelet/20
    text-tekhelet border-2 border-tekhelet
    hover:text-white hover:bg-tekhelet
  `,
  ghost: `
    bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700
    text-gray-700 dark:text-gray-300 border-2 border-transparent
  `,
};

/**
 * IconButton Component
 *
 * A square button that displays only an icon, with proper accessibility support.
 *
 * @example
 * ```tsx
 * <IconButton
 *   icon={<XIcon />}
 *   aria-label="Close modal"
 *   variant="ghost"
 *   onClick={handleClose}
 * />
 *
 * <IconButton
 *   icon={<TrashIcon />}
 *   aria-label="Delete item"
 *   variant="danger"
 *   size="sm"
 * />
 * ```
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      variant = "ghost",
      size = "md",
      icon,
      className = "",
      disabled,
      ...props
    },
    ref,
  ) => {
    const baseClasses = `
      inline-flex
      items-center
      justify-center
      rounded-lg
      transition-all
      duration-200
      ease-in-out
      focus:outline-none
      focus-visible:ring-2
      focus-visible:ring-purple-500
      focus-visible:ring-offset-2
      focus-visible:ring-offset-white
      dark:focus-visible:ring-offset-gray-900
      disabled:opacity-50
      disabled:cursor-not-allowed
      disabled:shadow-none
      ${sizeClasses[size]}
      ${variantClasses[variant]}
      ${className}
    `
      .trim()
      .replace(/\s+/g, " ");

    return (
      <button ref={ref} className={baseClasses} disabled={disabled} {...props}>
        {icon}
      </button>
    );
  },
);

IconButton.displayName = "IconButton";
