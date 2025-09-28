/**
 * Touch Target Component
 * Ensures minimum touch target size for mobile accessibility
 */
/// <reference types="react" />
import React from "react";
import type { JSX } from "react";
import { useHapticFeedback } from "../../hooks/mobile/useHapticFeedback";

interface TouchTargetProps {
  children: React.ReactNode;
  onTap?: () => void;
  onLongPress?: () => void;
  className?: string;
  disabled?: boolean;
  hapticFeedback?: "light" | "medium" | "heavy" | "none";
  as?: keyof React.JSX.IntrinsicElements;
  [key: string]: unknown; // For additional props
}

export const TouchTarget: React.FC<TouchTargetProps> = ({
  children,
  onTap,
  onLongPress,
  className = "",
  disabled = false,
  hapticFeedback = "light",
  as: Component = "button" as keyof React.JSX.IntrinsicElements,
  ...props
}) => {
  const { light, medium, heavy } = useHapticFeedback();

  const handleClick = () => {
    if (disabled) return;

    // Trigger haptic feedback
    if (hapticFeedback !== "none") {
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
    }

    onTap?.();
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (disabled) return;
    if (onLongPress) {
      e.preventDefault();
      onLongPress();
    }
  };

  const baseClasses = `
    touch-target
    relative
    inline-flex
    items-center
    justify-center
    min-h-[44px]
    min-w-[44px]
    transition-all
    duration-150
    ease-in-out
    focus:outline-none
    focus-visible:ring-2
    focus-visible:ring-purple-500
    focus-visible:ring-offset-2
    ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-98"}
    ${className}
  `;

  return (
    <Component
      className={baseClasses}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      disabled={disabled}
      {...props}
    >
      {children}
    </Component>
  );
};

export default TouchTarget;
