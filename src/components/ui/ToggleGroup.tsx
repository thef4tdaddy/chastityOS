/**
 * ToggleGroup Component
 * A standardized component for mutually exclusive button selections (like filter buttons)
 * Supports both single select (radio-like) and multiple select (checkbox-like) modes
 */
import React, { useCallback, useMemo } from "react";

export interface ToggleGroupOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface ToggleGroupProps {
  /**
   * Current selected value(s)
   * Single string for single mode, array for multiple mode
   */
  value: string | string[];
  /**
   * Callback when selection changes
   */
  onValueChange: (value: string | string[]) => void;
  /**
   * Available options
   */
  options: ToggleGroupOption[];
  /**
   * Selection mode
   * @default 'single'
   */
  type?: "single" | "multiple";
  /**
   * Size variant
   * @default 'md'
   */
  size?: "sm" | "md" | "lg";
  /**
   * Make buttons full width
   * @default false
   */
  fullWidth?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Aria label for the group
   */
  "aria-label"?: string;
}

// Size configurations
const sizeClasses = {
  sm: "text-xs px-2 py-1.5 gap-1.5",
  md: "text-sm px-3 py-2 gap-2",
  lg: "text-base px-4 py-2.5 gap-2.5",
};

/**
 * ToggleGroup Component
 *
 * @example
 * ```tsx
 * // Single select mode
 * <ToggleGroup
 *   value={selectedValue}
 *   onValueChange={setSelectedValue}
 *   options={[
 *     { value: 'option1', label: 'Option 1' },
 *     { value: 'option2', label: 'Option 2' },
 *   ]}
 *   type="single"
 * />
 *
 * // Multiple select mode with icons
 * <ToggleGroup
 *   value={selectedValues}
 *   onValueChange={setSelectedValues}
 *   options={[
 *     { value: 'option1', label: 'Option 1', icon: <Icon /> },
 *     { value: 'option2', label: 'Option 2', icon: <Icon /> },
 *   ]}
 *   type="multiple"
 * />
 * ```
 */
export const ToggleGroup: React.FC<ToggleGroupProps> = ({
  value,
  onValueChange,
  options,
  type = "single",
  size = "md",
  fullWidth = false,
  className = "",
  "aria-label": ariaLabel,
}) => {
  // Normalize value to array for consistent handling
  const selectedValues = useMemo(() => {
    return Array.isArray(value) ? value : [value];
  }, [value]);

  // Check if an option is selected
  const isSelected = useCallback(
    (optionValue: string) => {
      return selectedValues.includes(optionValue);
    },
    [selectedValues],
  );

  // Handle option click
  const handleClick = useCallback(
    (optionValue: string) => {
      if (type === "single") {
        // Single select mode - replace selection
        onValueChange(optionValue);
      } else {
        // Multiple select mode - toggle selection
        const newValues = isSelected(optionValue)
          ? selectedValues.filter((v) => v !== optionValue)
          : [...selectedValues, optionValue];
        onValueChange(newValues);
      }
    },
    [type, selectedValues, isSelected, onValueChange],
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, optionValue: string) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick(optionValue);
      }
    },
    [handleClick],
  );

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`inline-flex ${fullWidth ? "w-full" : ""} ${className}`}
    >
      {options.map((option, index) => {
        const selected = isSelected(option.value);
        const disabled = option.disabled || false;

        const buttonClasses = `
          inline-flex
          items-center
          justify-center
          font-medium
          transition-all
          duration-200
          ease-in-out
          focus:outline-none
          focus-visible:ring-2
          focus-visible:ring-purple-500
          focus-visible:ring-offset-2
          disabled:opacity-50
          disabled:cursor-not-allowed
          cursor-pointer
          ${fullWidth ? "flex-1" : ""}
          ${sizeClasses[size]}
          ${
            selected
              ? "bg-purple-600 text-white shadow-md"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          ${index === 0 ? "rounded-l-lg" : ""}
          ${index === options.length - 1 ? "rounded-r-lg" : ""}
          ${index > 0 && index < options.length ? "border-l border-gray-600" : ""}
        `
          .trim()
          .replace(/\s+/g, " ");

        return (
          <button
            key={option.value}
            type="button"
            role={type === "single" ? "radio" : "checkbox"}
            aria-checked={selected}
            aria-disabled={disabled}
            disabled={disabled}
            onClick={() => !disabled && handleClick(option.value)}
            onKeyDown={(e) => !disabled && handleKeyDown(e, option.value)}
            className={buttonClasses}
            tabIndex={disabled ? -1 : 0}
          >
            {option.icon && (
              <span className="flex-shrink-0">{option.icon}</span>
            )}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ToggleGroup;
