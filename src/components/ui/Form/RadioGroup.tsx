/**
 * RadioGroup Component
 * Group of radio buttons with keyboard navigation
 */
import React, { useRef, useEffect } from "react";
import { Radio } from "./Radio";

export interface RadioOption {
  value: string | number;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  /**
   * Current selected value
   */
  value: string | number;
  /**
   * Change handler with selected value
   */
  onChange: (value: string | number) => void;
  /**
   * Radio options
   */
  options: RadioOption[];
  /**
   * Name attribute for radio group
   */
  name: string;
  /**
   * Group label
   */
  label?: string;
  /**
   * Error message
   */
  error?: string;
  /**
   * Layout orientation
   * @default 'vertical'
   */
  orientation?: "horizontal" | "vertical";
  /**
   * Size of radio buttons
   * @default 'md'
   */
  size?: "sm" | "md" | "lg";
  /**
   * Additional class name
   */
  className?: string;
  /**
   * Disabled state for entire group
   */
  disabled?: boolean;
}

/**
 * RadioGroup Component
 *
 * An accessible radio button group with keyboard navigation support.
 * Supports both horizontal and vertical layouts.
 *
 * @example
 * ```tsx
 * <RadioGroup
 *   name="preference"
 *   label="Choose your preference"
 *   value={selectedValue}
 *   onChange={setSelectedValue}
 *   options={[
 *     { value: 'option1', label: 'Option 1', description: 'First option' },
 *     { value: 'option2', label: 'Option 2', description: 'Second option' },
 *   ]}
 * />
 * ```
 */
export const RadioGroup: React.FC<RadioGroupProps> = ({
  value,
  onChange,
  options,
  name,
  label,
  error,
  orientation = "vertical",
  size = "md",
  className = "",
  disabled = false,
}) => {
  const groupRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation handler
  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isForward =
        e.key === "ArrowDown" ||
        (e.key === "ArrowRight" && orientation === "horizontal");
      const isBackward =
        e.key === "ArrowUp" ||
        (e.key === "ArrowLeft" && orientation === "horizontal");

      if (!isForward && !isBackward) return;

      e.preventDefault();

      const currentIndex = options.findIndex((opt) => opt.value === value);
      const direction = isForward ? 1 : -1;
      const totalOptions = options.length;
      let nextIndex = (currentIndex + direction + totalOptions) % totalOptions;
      let attempts = 0;

      // Skip disabled options
      while (options[nextIndex]?.disabled && attempts < totalOptions) {
        nextIndex = (nextIndex + direction + totalOptions) % totalOptions;
        attempts++;
      }

      const nextOption = options[nextIndex];
      if (nextIndex !== currentIndex && nextOption && !nextOption.disabled) {
        onChange(nextOption.value);
      }
    };

    const element = groupRef.current;
    element?.addEventListener("keydown", handleKeyDown);

    return () => {
      element?.removeEventListener("keydown", handleKeyDown);
    };
  }, [value, options, onChange, orientation, disabled]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedValue = e.target.value;
    // Try to parse as number if the original option value was a number
    const option = options.find((opt) => String(opt.value) === selectedValue);
    if (option) {
      onChange(option.value);
    }
  };

  return (
    <div className={`${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {label}
        </label>
      )}

      <div
        ref={groupRef}
        role="radiogroup"
        aria-label={label}
        aria-invalid={!!error}
        className={`
          ${orientation === "horizontal" ? "flex flex-wrap gap-4" : "space-y-3"}
        `
          .trim()
          .replace(/\s+/g, " ")}
        tabIndex={0}
      >
        {options.map((option) => (
          <Radio
            key={String(option.value)}
            name={name}
            value={option.value}
            label={option.label}
            description={option.description}
            checked={value === option.value}
            onChange={handleChange}
            disabled={disabled || option.disabled}
            size={size}
          />
        ))}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};

RadioGroup.displayName = "RadioGroup";
