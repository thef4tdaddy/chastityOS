/**
 * Switch Component
 * Toggle switch for boolean values
 */
import React, { forwardRef, useId } from "react";

export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  /**
   * Switch label
   */
  label?: string;
  /**
   * Description text below label
   */
  description?: string;
  /**
   * Switch size
   * @default 'md'
   */
  size?: "sm" | "md" | "lg";
  /**
   * Checked state
   */
  checked?: boolean;
  /**
   * Change handler
   */
  onCheckedChange?: (checked: boolean) => void;
}

// Size configurations
const sizeClasses = {
  sm: {
    track: "w-9 h-5",
    thumb: "h-4 w-4",
    translate: "peer-checked:translate-x-4",
  },
  md: {
    track: "w-11 h-6",
    thumb: "h-5 w-5",
    translate: "peer-checked:translate-x-5",
  },
  lg: {
    track: "w-14 h-7",
    thumb: "h-6 w-6",
    translate: "peer-checked:translate-x-7",
  },
};

/**
 * Switch Component
 *
 * An accessible toggle switch component for boolean values.
 *
 * @example
 * ```tsx
 * <Switch
 *   label="Enable notifications"
 *   description="Receive email notifications"
 *   checked={isEnabled}
 *   onCheckedChange={setIsEnabled}
 * />
 *
 * <Switch
 *   label="Dark mode"
 *   size="lg"
 *   checked={isDarkMode}
 *   onCheckedChange={setIsDarkMode}
 * />
 * ```
 */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      label,
      description,
      size = "md",
      checked = false,
      onCheckedChange,
      onChange,
      className = "",
      id,
      disabled,
      ...props
    },
    ref,
  ) => {
    // Generate unique ID if not provided using React's useId hook
    const generatedId = useId();
    const switchId = id || generatedId;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);
      onCheckedChange?.(e.target.checked);
    };

    const { track, thumb, translate } = sizeClasses[size];

    return (
      <div className={`flex items-center justify-between ${className}`}>
        {(label || description) && (
          <div className="flex-1 mr-4">
            {label && (
              <label
                htmlFor={switchId}
                className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {description}
              </p>
            )}
          </div>
        )}

        <label
          className={`relative inline-flex items-center ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
        >
          <input
            ref={ref}
            id={switchId}
            type="checkbox"
            className="sr-only peer"
            checked={checked}
            onChange={handleChange}
            disabled={disabled}
            {...props}
          />
          <div
            className={`
              ${track}
              bg-gray-300 dark:bg-gray-600
              peer-focus:outline-none
              peer-focus:ring-2
              peer-focus:ring-purple-500
              peer-focus:ring-offset-2
              peer-focus:ring-offset-white
              dark:peer-focus:ring-offset-gray-900
              rounded-full
              peer
              peer-checked:bg-tekhelet
              after:content-['']
              after:absolute
              after:top-[2px]
              after:left-[2px]
              after:bg-white
              after:rounded-full
              ${thumb}
              after:transition-all
              ${translate}
              transition-colors
              duration-200
              ease-in-out
            `
              .trim()
              .replace(/\s+/g, " ")}
          />
        </label>
      </div>
    );
  },
);

Switch.displayName = "Switch";
