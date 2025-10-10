/**
 * Radio Component
 * Custom styled radio button with label and description
 */
import React, { forwardRef } from "react";

export interface RadioProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  /**
   * Radio button label
   */
  label?: string;
  /**
   * Description text below label
   */
  description?: string;
  /**
   * Radio button size
   * @default 'md'
   */
  size?: "sm" | "md" | "lg";
  /**
   * Checked state
   */
  checked?: boolean;
  /**
   * Value of the radio button
   */
  value: string | number;
}

// Size configurations
const sizeClasses = {
  sm: {
    radio: "w-4 h-4",
    dot: "w-2 h-2",
    text: "text-sm",
    description: "text-xs",
  },
  md: {
    radio: "w-5 h-5",
    dot: "w-2.5 h-2.5",
    text: "text-base",
    description: "text-sm",
  },
  lg: {
    radio: "w-6 h-6",
    dot: "w-3 h-3",
    text: "text-lg",
    description: "text-base",
  },
};

/**
 * Radio Component
 *
 * A custom styled radio button component with support for labels,
 * descriptions, and size variants.
 *
 * @example
 * ```tsx
 * <Radio
 *   label="Option 1"
 *   description="This is option 1"
 *   checked={value === "option1"}
 *   onChange={() => setValue("option1")}
 *   value="option1"
 *   name="options"
 * />
 *
 * <Radio
 *   label="Option 2"
 *   size="lg"
 *   checked={value === "option2"}
 *   onChange={() => setValue("option2")}
 *   value="option2"
 *   name="options"
 * />
 * ```
 */
export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      label,
      description,
      size = "md",
      checked = false,
      className = "",
      id,
      disabled,
      value,
      ...props
    },
    ref,
  ) => {
    // Generate unique ID if not provided
    const radioId = id || `radio-${Math.random().toString(36).substr(2, 9)}`;

    const { radio, dot, text, description: descSize } = sizeClasses[size];

    return (
      <label
        htmlFor={radioId}
        className={`
          flex items-start
          ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
          ${className}
        `}
      >
        <div className="relative flex items-center justify-center flex-shrink-0 mt-0.5">
          <input
            ref={ref}
            id={radioId}
            type="radio"
            value={value}
            checked={checked}
            disabled={disabled}
            className="sr-only peer"
            {...props}
          />
          {/* Custom radio circle */}
          <div
            className={`
              ${radio}
              border-2
              rounded-full
              transition-all duration-200 ease-in-out
              ${
                checked
                  ? "border-purple-500 bg-purple-500/10 backdrop-blur-sm"
                  : "border-gray-300 dark:border-gray-600 bg-white/5 backdrop-blur-sm"
              }
              ${!disabled && "peer-focus:ring-2 peer-focus:ring-purple-500/30 peer-focus:ring-offset-2 peer-focus:ring-offset-white dark:peer-focus:ring-offset-gray-900"}
              ${!disabled && !checked && "hover:border-purple-400 hover:bg-purple-500/5"}
              flex items-center justify-center
            `}
          >
            {/* Filled dot when selected */}
            {checked && (
              <div
                className={`
                  ${dot}
                  rounded-full
                  bg-purple-500
                  animate-scale-in
                `}
              />
            )}
          </div>
        </div>

        {/* Label and description */}
        {(label || description) && (
          <div className="ml-3 flex-1">
            {label && (
              <div
                className={`
                  ${text}
                  font-medium
                  text-gray-900 dark:text-gray-100
                  ${checked ? "text-purple-600 dark:text-purple-400" : ""}
                `}
              >
                {label}
              </div>
            )}
            {description && (
              <div
                className={`
                  ${descSize}
                  text-gray-500 dark:text-gray-400
                  mt-0.5
                `}
              >
                {description}
              </div>
            )}
          </div>
        )}
      </label>
    );
  },
);

Radio.displayName = "Radio";
