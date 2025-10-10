/**
 * Checkbox Component
 * A standardized checkbox component with label, description, and various states
 */
import React, { forwardRef, useId } from "react";
import { FaCheck, FaMinus } from "../../../utils/iconImport";

export interface CheckboxProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "type" | "size" | "onChange"
  > {
  /**
   * Checked state
   */
  checked: boolean;
  /**
   * Change handler - receives boolean instead of event
   */
  onChange: (checked: boolean) => void;
  /**
   * Optional label text to the right of checkbox
   */
  label?: string;
  /**
   * Optional description text below label
   */
  description?: string;
  /**
   * Error message to display
   */
  error?: string;
  /**
   * Size variant
   * @default 'md'
   */
  size?: "sm" | "md" | "lg";
  /**
   * Indeterminate state (partial check)
   */
  indeterminate?: boolean;
}

// Size configurations
const sizeClasses = {
  sm: {
    box: "w-4 h-4",
    icon: "text-[10px]",
    label: "text-sm",
    description: "text-xs",
  },
  md: {
    box: "w-5 h-5",
    icon: "text-xs",
    label: "text-base",
    description: "text-sm",
  },
  lg: {
    box: "w-6 h-6",
    icon: "text-sm",
    label: "text-lg",
    description: "text-base",
  },
};

/**
 * Checkbox component with custom styling and accessibility features
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  // eslint-disable-next-line complexity
  (
    {
      checked,
      onChange,
      label,
      description,
      error,
      size = "md",
      indeterminate = false,
      disabled = false,
      className = "",
      id,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const checkboxId = id || generatedId;
    const sizes = sizeClasses[size];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.checked);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLLabelElement>) => {
      if (e.key === " " && !disabled) {
        e.preventDefault();
        onChange(!checked);
      }
    };

    // Build checkbox box classes
    const isCheckedOrIndeterminate = checked || indeterminate;
    const boxBaseClasses = `${sizes.box} flex items-center justify-center rounded border-2 transition-all duration-200 flex-shrink-0`;
    const boxStateClasses = isCheckedOrIndeterminate
      ? "bg-nightly-aquamarine border-nightly-aquamarine"
      : "bg-white/10 border-white/20";
    const boxHoverClasses =
      !disabled && !isCheckedOrIndeterminate
        ? "hover:border-nightly-aquamarine/50"
        : "";
    const boxFocusClasses = !disabled
      ? "focus-within:ring-2 focus-within:ring-nightly-aquamarine focus-within:ring-offset-2 focus-within:ring-offset-dark_purple"
      : "";
    const boxErrorClasses = error ? "border-red-500" : "";
    const boxClasses = `${boxBaseClasses} ${boxStateClasses} ${boxHoverClasses} ${boxFocusClasses} ${boxErrorClasses}`;

    return (
      <div className={`flex flex-col ${className}`}>
        <label
          htmlFor={checkboxId}
          className={`flex items-start gap-2 cursor-pointer select-none ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          onKeyDown={handleKeyDown}
          tabIndex={disabled ? -1 : 0}
        >
          {/* Hidden native checkbox for accessibility */}
          <input
            ref={ref}
            id={checkboxId}
            type="checkbox"
            checked={checked}
            onChange={handleChange}
            disabled={disabled}
            className="sr-only"
            {...props}
          />

          {/* Custom checkbox box */}
          <div className={boxClasses}>
            {checked && !indeterminate && (
              <FaCheck className={`${sizes.icon} text-dark_purple`} />
            )}
            {indeterminate && (
              <FaMinus className={`${sizes.icon} text-dark_purple`} />
            )}
          </div>

          {/* Label and description */}
          {(label || description) && (
            <div className="flex flex-col gap-0.5">
              {label && (
                <span
                  className={`${sizes.label} text-nightly-celadon font-medium`}
                >
                  {label}
                </span>
              )}
              {description && (
                <span
                  className={`${sizes.description} text-nightly-celadon/70`}
                >
                  {description}
                </span>
              )}
            </div>
          )}
        </label>

        {/* Error message */}
        {error && (
          <span className="text-sm text-red-400 mt-1 ml-7">{error}</span>
        )}
      </div>
    );
  },
);

Checkbox.displayName = "Checkbox";
