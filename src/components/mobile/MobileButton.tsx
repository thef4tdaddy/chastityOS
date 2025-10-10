/**
 * Mobile Button Component
 * Touch-optimized button with haptic feedback
 */
import React, { forwardRef } from "react";
import { useHapticFeedback } from "../../hooks/mobile/useHapticFeedback";
import { Button } from "@/components/ui";

interface MobileButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "xl";
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  hapticFeedback?: "light" | "medium" | "heavy" | "none";
}

// Button style configurations
const BUTTON_STYLES = {
  sizes: {
    sm: "h-10 px-4 text-sm font-medium",
    md: "h-12 px-6 text-base font-semibold",
    lg: "h-14 px-8 text-lg font-semibold",
    xl: "h-16 px-10 text-xl font-bold",
  },
  variants: {
    primary: `
      bg-tekhelet hover:bg-tekhelet-600 active:bg-tekhelet-700
      text-white border-2 border-tekhelet
      shadow-lg hover:shadow-xl active:shadow-md
    `,
    secondary: `
      bg-lavender_web hover:bg-lavender_web-600 active:bg-lavender_web-700
      text-dark_purple border-2 border-lavender_web
      shadow-lg hover:shadow-xl active:shadow-md
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
    danger: `
      bg-red-500 hover:bg-red-600 active:bg-red-700
      text-white border-2 border-red-500
      shadow-lg hover:shadow-xl active:shadow-md
    `,
  },
};

// Loading Spinner Component
const LoadingSpinner: React.FC = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
  </div>
);

// Button Content Component
const ButtonContent: React.FC<{
  loading: boolean;
  leftIcon?: React.ReactNode;
  children: React.ReactNode;
  rightIcon?: React.ReactNode;
}> = ({ loading, leftIcon, children, rightIcon }) => (
  <div
    className={`flex items-center space-x-2 ${loading ? "opacity-0" : "opacity-100"}`}
  >
    {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
    {children && <span className="truncate">{children}</span>}
    {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
  </div>
);

// Ripple Effect Component
const RippleEffect: React.FC = () => (
  <div className="absolute inset-0 rounded-xl overflow-hidden">
    <div className="absolute inset-0 bg-white/20 transform scale-0 group-active:scale-100 transition-transform duration-150 ease-out" />
  </div>
);

// Custom hook for haptic feedback handling
const useButtonHaptics = (
  hapticFeedback?: "light" | "medium" | "heavy" | "none",
) => {
  const { light, medium, heavy } = useHapticFeedback();

  const triggerHapticFeedback = () => {
    if (!hapticFeedback || hapticFeedback === "none") return;

    switch (hapticFeedback) {
      case "light":
        light();
        break;
      case "medium":
        medium();
        break;
      case "heavy":
        heavy();
        break;
    }
  };

  return triggerHapticFeedback;
};

// Custom hook for button styling
const useButtonStyling = (
  variant?: keyof typeof BUTTON_STYLES.variants,
  size?: keyof typeof BUTTON_STYLES.sizes,
  fullWidth?: boolean,
  className?: string,
) => {
  const baseClasses = `
    relative
    inline-flex
    items-center
    justify-center
    min-h-[44px]
    rounded-xl
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
    transform
    active:scale-98
    disabled:opacity-50
    disabled:cursor-not-allowed
    disabled:transform-none
    ${fullWidth ? "w-full" : ""}
    ${BUTTON_STYLES.sizes[size || "md"]}
    ${BUTTON_STYLES.variants[variant || "primary"]}
    ${className || ""}
  `
    .trim()
    .replace(/\s+/g, " ");

  return baseClasses;
};

export const MobileButton = forwardRef<HTMLButtonElement, MobileButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      fullWidth = false,
      loading = false,
      leftIcon,
      rightIcon,
      hapticFeedback = "light",
      children,
      className = "",
      onClick,
      disabled,
      ...props
    },
    ref,
  ) => {
    const triggerHapticFeedback = useButtonHaptics(
      hapticFeedback as "light" | "medium" | "heavy" | "none",
    );
    const buttonClasses = useButtonStyling(
      variant as keyof typeof BUTTON_STYLES.variants,
      size as keyof typeof BUTTON_STYLES.sizes,
      fullWidth,
      className,
    );

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || loading) return;

      triggerHapticFeedback();
      onClick?.(e);
    };

    return (
      <Button
        ref={ref}
        className={buttonClasses}
        onClick={handleClick}
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

        <RippleEffect />
      </Button>
    );
  },
);

MobileButton.displayName = "MobileButton";

export default MobileButton;
