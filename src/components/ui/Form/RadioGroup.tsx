/**
 * RadioGroup Component
 * Group of radio buttons with consistent behavior
 */
import React, { useCallback } from "react";
import { Radio } from "./Radio";

export interface RadioOption {
  value: string | number;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  /**
   * Currently selected value
   */
  value: string | number;
  /**
   * Callback when value changes
   */
  onChange: (value: string | number) => void;
  /**
   * Radio options to display
   */
  options: RadioOption[];
  /**
   * Name attribute for radio group
   */
  name: string;
  /**
   * Label for the entire group
   */
  label?: string;
  /**
   * Error message to display
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
   * Whether the field is required
   */
  required?: boolean;
}

/**
 * Group Label Component
 */
const GroupLabel: React.FC<{
  label?: string;
  required?: boolean;
}> = ({ label, required }) => {
  if (!label) return null;

  return (
    <legend className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </legend>
  );
};

/**
 * Error Message Component
 */
const ErrorMessage: React.FC<{ error?: string }> = ({ error }) => {
  if (!error) return null;

  return (
    <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
      <svg
        className="w-4 h-4 mr-1 flex-shrink-0"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      {error}
    </p>
  );
};

/**
 * RadioGroup Component
 *
 * A group of radio buttons with automatic name management and keyboard navigation.
 *
 * @example
 * ```tsx
 * const options = [
 *   { value: 'option1', label: 'Option 1', description: 'First option' },
 *   { value: 'option2', label: 'Option 2', description: 'Second option' },
 *   { value: 'option3', label: 'Option 3', disabled: true },
 * ];
 *
 * <RadioGroup
 *   label="Choose an option"
 *   name="my-options"
 *   value={selectedValue}
 *   onChange={setSelectedValue}
 *   options={options}
 * />
 *
 * <RadioGroup
 *   label="Layout"
 *   name="layout"
 *   value={layout}
 *   onChange={setLayout}
 *   options={layoutOptions}
 *   orientation="horizontal"
 *   size="lg"
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
  required,
}) => {
  const handleChange = useCallback(
    (optionValue: string | number) => {
      onChange(optionValue);
    },
    [onChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLFieldSetElement>) => {
      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key))
        return;

      e.preventDefault();

      const enabledOptions = options.filter((opt) => !opt.disabled);
      const currentIndex = enabledOptions.findIndex(
        (opt) => opt.value === value,
      );

      let nextIndex = currentIndex;

      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        nextIndex = (currentIndex + 1) % enabledOptions.length;
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        nextIndex =
          currentIndex <= 0 ? enabledOptions.length - 1 : currentIndex - 1;
      }

      if (nextIndex !== currentIndex) {
        onChange(enabledOptions[nextIndex].value);
      }
    },
    [options, value, onChange],
  );

  const containerClasses = `
    ${orientation === "horizontal" ? "flex flex-wrap gap-4" : "space-y-3"}
  `;

  return (
    <fieldset
      className={className}
      onKeyDown={handleKeyDown}
      role="radiogroup"
      aria-required={required}
      aria-invalid={!!error}
    >
      <GroupLabel label={label} required={required} />

      <div className={containerClasses}>
        {options.map((option) => (
          <Radio
            key={option.value}
            name={name}
            value={option.value}
            label={option.label}
            description={option.description}
            checked={value === option.value}
            onChange={() => handleChange(option.value)}
            disabled={option.disabled}
            size={size}
          />
        ))}
      </div>

      <ErrorMessage error={error} />
    </fieldset>
  );
};

RadioGroup.displayName = "RadioGroup";
