/**
 * ToggleGroup Component
 * A reusable component for mutually exclusive or multiple button selections
 */
import React, { forwardRef, useCallback, useRef } from "react";

export interface ToggleGroupOption {
  /**
   * Unique value for this option
   */
  value: string;
  /**
   * Display label for the option
   */
  label: string;
  /**
   * Optional icon to display
   */
  icon?: React.ReactNode;
  /**
   * Whether this option is disabled
   */
  disabled?: boolean;
}

export interface ToggleGroupProps {
  /**
   * Current selected value(s)
   * - string for single select mode
   * - string[] for multiple select mode
   */
  value: string | string[];
  /**
   * Callback when value changes
   */
  onValueChange: (value: string | string[]) => void;
  /**
   * Array of options to display
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
   * Make the group full width
   * @default false
   */
  fullWidth?: boolean;
  /**
   * Accessible label for the group
   */
  "aria-label"?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Disable the entire group
   */
  disabled?: boolean;
}

// Size configurations
const sizeClasses = {
  sm: "px-2 py-1 text-xs",
  md: "px-3 py-2 text-sm",
  lg: "px-4 py-3 text-base",
};

/**
 * ToggleGroup Component
 *
 * A reusable component for creating button groups with single or multiple selection modes.
 * Supports keyboard navigation, icons, and various size variants.
 *
 * @example Single Select
 * ```tsx
 * <ToggleGroup
 *   type="single"
 *   value={selectedValue}
 *   onValueChange={setSelectedValue}
 *   options={[
 *     { value: 'option1', label: 'Option 1' },
 *     { value: 'option2', label: 'Option 2' },
 *   ]}
 * />
 * ```
 *
 * @example Multiple Select
 * ```tsx
 * <ToggleGroup
 *   type="multiple"
 *   value={selectedValues}
 *   onValueChange={setSelectedValues}
 *   options={[
 *     { value: 'option1', label: 'Option 1', icon: <Icon /> },
 *     { value: 'option2', label: 'Option 2', icon: <Icon /> },
 *   ]}
 * />
 * ```
 */
export const ToggleGroup = forwardRef<HTMLDivElement, ToggleGroupProps>(
  (
    {
      value,
      onValueChange,
      options,
      type = "single",
      size = "md",
      fullWidth = false,
      "aria-label": ariaLabel,
      className = "",
      disabled = false,
    },
    ref,
  ) => {
    const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

    // Check if a value is selected
    const isSelected = useCallback(
      (optionValue: string): boolean => {
        if (type === "single") {
          return value === optionValue;
        }
        return Array.isArray(value) && value.includes(optionValue);
      },
      [value, type],
    );

    // Handle selection
    const handleSelect = useCallback(
      (optionValue: string) => {
        if (type === "single") {
          onValueChange(optionValue);
        } else {
          const currentValues = Array.isArray(value) ? value : [];
          if (currentValues.includes(optionValue)) {
            // Remove from selection
            onValueChange(currentValues.filter((v) => v !== optionValue));
          } else {
            // Add to selection
            onValueChange([...currentValues, optionValue]);
          }
        }
      },
      [type, value, onValueChange],
    );

    // Keyboard navigation
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent, index: number) => {
        const enabledIndices = options
          .map((opt, i) => (!opt.disabled ? i : -1))
          .filter((i) => i !== -1);

        const currentEnabledIndex = enabledIndices.indexOf(index);

        let nextIndex = -1;

        switch (e.key) {
          case "ArrowLeft":
          case "ArrowUp":
            e.preventDefault();
            if (currentEnabledIndex > 0) {
              nextIndex = enabledIndices[currentEnabledIndex - 1];
            } else {
              nextIndex = enabledIndices[enabledIndices.length - 1];
            }
            break;
          case "ArrowRight":
          case "ArrowDown":
            e.preventDefault();
            if (currentEnabledIndex < enabledIndices.length - 1) {
              nextIndex = enabledIndices[currentEnabledIndex + 1];
            } else {
              nextIndex = enabledIndices[0];
            }
            break;
          case "Home":
            e.preventDefault();
            nextIndex = enabledIndices[0];
            break;
          case "End":
            e.preventDefault();
            nextIndex = enabledIndices[enabledIndices.length - 1];
            break;
        }

        if (nextIndex !== -1 && buttonRefs.current[nextIndex]) {
          buttonRefs.current[nextIndex]?.focus();
        }
      },
      [options],
    );

    return (
      <div
        ref={ref}
        role={type === "single" ? "radiogroup" : "group"}
        aria-label={ariaLabel}
        className={`
          flex
          ${fullWidth ? "w-full" : "inline-flex"}
          ${fullWidth ? "" : "flex-wrap"}
          gap-1
          bg-black/20
          rounded-lg
          p-1
          ${className}
        `
          .trim()
          .replace(/\s+/g, " ")}
      >
        {options.map((option, index) => {
          const selected = isSelected(option.value);
          const isDisabled = disabled || option.disabled;

          return (
            <button
              key={option.value}
              ref={(el) => (buttonRefs.current[index] = el)}
              role={type === "single" ? "radio" : "checkbox"}
              aria-checked={selected}
              aria-disabled={isDisabled}
              type="button"
              disabled={isDisabled}
              onClick={() => !isDisabled && handleSelect(option.value)}
              onKeyDown={(e) => !isDisabled && handleKeyDown(e, index)}
              tabIndex={
                isDisabled ? -1 : type === "single" && !selected ? -1 : 0
              }
              className={`
                ${fullWidth ? "flex-1" : ""}
                flex
                items-center
                justify-center
                gap-2
                ${sizeClasses[size]}
                rounded-lg
                font-medium
                transition-all
                duration-200
                ease-in-out
                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-purple-500
                focus-visible:ring-offset-2
                focus-visible:ring-offset-transparent
                ${
                  selected
                    ? "bg-nightly-lavender-floral text-white shadow-md"
                    : "text-nightly-celadon hover:text-nightly-honeydew hover:bg-white/5"
                }
                ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `
                .trim()
                .replace(/\s+/g, " ")}
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
  },
);

ToggleGroup.displayName = "ToggleGroup";
