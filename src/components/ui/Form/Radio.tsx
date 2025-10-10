/**
 * Radio Component
 * Custom styled radio button for single selection
 */
import React, { forwardRef } from "react";

export interface RadioProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  /**
   * Radio label (can be string or React node for custom styling)
   */
  label?: string | React.ReactNode;
  /**
   * Description text below label
   */
  description?: string;
  /**
   * Radio size
   * @default 'md'
   */
  size?: "sm" | "md" | "lg";
  /**
   * Checked state
   */
  checked?: boolean;
  /**
   * Radio value
   */
  value: string | number;
  /**
   * Change handler
   */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

// Size configurations
const sizeClasses = {
  sm: {
    radio: "w-4 h-4",
    circle: "after:w-2 after:h-2",
    text: "text-sm",
  },
  md: {
    radio: "w-5 h-5",
    circle: "after:w-2.5 after:h-2.5",
    text: "text-base",
  },
  lg: {
    radio: "w-6 h-6",
    circle: "after:w-3 after:h-3",
    text: "text-lg",
  },
};

/**
 * Radio Component
 *
 * An accessible custom radio button component with optional label and description.
 *
 * @example
 * ```tsx
 * <Radio
 *   label="Option 1"
 *   description="This is the first option"
 *   value="option1"
 *   checked={selected === "option1"}
 *   onChange={(e) => setSelected(e.target.value)}
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
      value,
      onChange,
      className = "",
      id,
      disabled,
      name,
      ...props
    },
    ref,
  ) => {
    // Generate unique ID if not provided
    const radioId =
      id || `radio-${value}-${Math.random().toString(36).substr(2, 9)}`;

    const { radio, circle, text } = sizeClasses[size];

    return (
      <div className={`flex items-start ${className}`}>
        <div className="flex items-center h-5">
          <input
            ref={ref}
            id={radioId}
            type="radio"
            name={name}
            value={value}
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            className="sr-only peer"
            {...props}
          />
          <label
            htmlFor={radioId}
            className={`
              ${radio}
              relative
              flex
              items-center
              justify-center
              rounded-full
              border-2
              ${disabled ? "cursor-not-allowed opacity-50 border-gray-400" : "cursor-pointer border-gray-400 dark:border-gray-500"}
              ${checked && !disabled ? "border-tekhelet dark:border-tekhelet" : ""}
              peer-focus:outline-none
              peer-focus:ring-2
              peer-focus:ring-purple-500
              peer-focus:ring-offset-2
              peer-focus:ring-offset-white
              dark:peer-focus:ring-offset-gray-900
              transition-all
              duration-200
              ease-in-out
              bg-white
              dark:bg-gray-800
              backdrop-blur-sm
              ${checked ? "after:opacity-100 after:scale-100" : "after:opacity-0 after:scale-0"}
              after:content-['']
              after:absolute
              after:rounded-full
              ${circle}
              after:bg-tekhelet
              dark:after:bg-tekhelet
              after:transition-all
              after:duration-200
              after:ease-in-out
            `
              .trim()
              .replace(/\s+/g, " ")}
          />
        </div>
        {(label || description) && (
          <div className="ml-3 flex-1">
            {label && (
              <label
                htmlFor={radioId}
                className={`
                  ${text}
                  font-medium
                  ${disabled ? "text-gray-400 cursor-not-allowed" : "text-gray-700 dark:text-gray-300 cursor-pointer"}
                  block
                `
                  .trim()
                  .replace(/\s+/g, " ")}
              >
                {label}
              </label>
            )}
            {description && (
              <p
                className={`
                  text-xs
                  ${disabled ? "text-gray-400" : "text-gray-500 dark:text-gray-400"}
                  mt-0.5
                `
                  .trim()
                  .replace(/\s+/g, " ")}
              >
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    );
  },
);

Radio.displayName = "Radio";
