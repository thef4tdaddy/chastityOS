/**
 * Button Component
 * Reusable button component with variants, sizes, and states
 */
import React, { forwardRef } from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual style variant
   * @default 'primary'
   */
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  /**
   * Button size
   * @default 'md'
   */
  size?: "sm" | "md" | "lg";
  /**
   * Show loading spinner and disable button
   * @default false
   */
  loading?: boolean;
  /**
   * Make button full width
   * @default false
   */
  fullWidth?: boolean;
  /**
   * Icon to show on the left side
   */
  leftIcon?: React.ReactNode;
  /**
   * Icon to show on the right side
   */
  rightIcon?: React.ReactNode;
  /**
   * Button content
   */
  children?: React.ReactNode;
}

// Size configurations
const sizeClasses = {
  sm: "h-9 px-3 text-sm font-medium",
  md: "h-10 px-4 text-base font-semibold",
  lg: "h-12 px-6 text-lg font-semibold",
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
 * Loading spinner component
 */
const LoadingSpinner: React.FC = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
  </div>
);

/**
 * Button content wrapper
 */
const ButtonContent: React.FC<{
  loading: boolean;
  leftIcon?: React.ReactNode;
  children: React.ReactNode;
  rightIcon?: React.ReactNode;
}> = ({ loading, leftIcon, children, rightIcon }) => (
  <span
    className={`flex items-center justify-center gap-2 ${loading ? "opacity-0" : "opacity-100"}`}
  >
    {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
    {children && <span>{children}</span>}
    {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
  </span>
);

/**
 * Button Component
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="md">
 *   Click me
 * </Button>
 *
 * <Button variant="secondary" loading>
 *   Loading...
 * </Button>
 *
 * <Button variant="outline" leftIcon={<Icon />}>
 *   With Icon
 * </Button>
 * ```
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      children,
      className = "",
      disabled,
      ...props
    },
    ref,
  ) => {
    const baseClasses = `
      relative
      inline-flex
      items-center
      justify-center
      rounded-lg
      font-medium
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
      ${fullWidth ? "w-full" : ""}
      ${sizeClasses[size]}
      ${variantClasses[variant]}
      ${className}
    `
      .trim()
      .replace(/\s+/g, " ");

    return (
      <button
        ref={ref}
        className={baseClasses}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <LoadingSpinner />}
        <ButtonContent
          loading={loading}
          leftIcon={leftIcon}
          rightIcon={rightIcon}
        >
          {children}
        </ButtonContent>
      </button>
    );
  },
);

Button.displayName = "Button";
