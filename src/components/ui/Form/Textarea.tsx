/**
 * Textarea Component
 * Multi-line text input field with label and error states
 */
import React, { forwardRef, useId } from "react";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /**
   * Textarea label
   */
  label?: string;
  /**
   * Error message to display
   */
  error?: string;
  /**
   * Help text to display below textarea
   */
  helpText?: string;
  /**
   * Show character count
   */
  showCharacterCount?: boolean;
  /**
   * Textarea variant
   * @default 'default'
   */
  variant?: "default" | "filled";
  /**
   * Auto-resize textarea based on content
   * @default false
   */
  autoResize?: boolean;
}

// Variant classes
const variantClasses = {
  default:
    "border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800",
  filled: "border-2 border-transparent bg-gray-100 dark:bg-gray-700",
};

/**
 * Textarea Label Component
 */
const TextareaLabel: React.FC<{
  label?: string;
  required?: boolean;
  htmlFor?: string;
}> = ({ label, required, htmlFor }) => {
  if (!label) return null;

  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
    >
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
};

/**
 * Character Count Component
 */
const CharacterCount: React.FC<{
  current: number;
  max?: number;
}> = ({ current, max }) => {
  const isOverLimit = max !== undefined && current > max;

  return (
    <div
      className={`text-xs ${isOverLimit ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-gray-400"}`}
    >
      {current}
      {max !== undefined && ` / ${max}`}
    </div>
  );
};

/**
 * Textarea Message Component
 */
const TextareaMessage: React.FC<{
  error?: string;
  helpText?: string;
  showCharacterCount?: boolean;
  characterCount?: number;
  maxLength?: number;
}> = ({ error, helpText, showCharacterCount, characterCount, maxLength }) => {
  const hasContent = error || helpText || showCharacterCount;

  if (!hasContent) return null;

  return (
    <div className="mt-1.5 flex items-start justify-between gap-2">
      <div className="flex-1">
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
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
        )}
        {!error && helpText && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{helpText}</p>
        )}
      </div>
      {showCharacterCount && characterCount !== undefined && (
        <CharacterCount current={characterCount} max={maxLength} />
      )}
    </div>
  );
};

/**
 * Textarea Component
 *
 * @example
 * ```tsx
 * <Textarea
 *   label="Description"
 *   placeholder="Enter description..."
 *   rows={4}
 * />
 *
 * <Textarea
 *   label="Bio"
 *   placeholder="Tell us about yourself"
 *   maxLength={500}
 *   showCharacterCount
 * />
 *
 * <Textarea
 *   label="Comments"
 *   error="This field is required"
 *   required
 * />
 * ```
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helpText,
      showCharacterCount = false,
      variant = "default",
      autoResize = false,
      className = "",
      id,
      required,
      value,
      onChange,
      maxLength,
      rows = 4,
      ...props
    },
    ref,
  ) => {
    // Generate unique ID if not provided using React's useId hook
    const generatedId = useId();
    const textareaId = id || generatedId;

    // Calculate character count
    const characterCount =
      typeof value === "string" ? value.length : value?.toString().length || 0;

    const textareaClasses = `
      w-full
      px-4 py-3
      ${variantClasses[variant]}
      ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "focus:border-purple-500 focus:ring-purple-500/20"}
      rounded-lg
      font-medium
      text-gray-900 dark:text-white
      placeholder-gray-500 dark:placeholder-gray-400
      transition-all duration-200 ease-in-out
      focus:outline-none focus:ring-2
      disabled:opacity-50 disabled:cursor-not-allowed
      ${autoResize ? "resize-none" : "resize-y"}
      ${className}
    `
      .trim()
      .replace(/\s+/g, " ");

    // Auto-resize handler
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (autoResize) {
        e.target.style.height = "auto";
        e.target.style.height = `${e.target.scrollHeight}px`;
      }
      onChange?.(e);
    };

    return (
      <div className="w-full">
        <TextareaLabel label={label} required={required} htmlFor={textareaId} />

        <textarea
          ref={ref}
          id={textareaId}
          className={textareaClasses}
          value={value}
          onChange={handleChange}
          maxLength={maxLength}
          rows={rows}
          {...props}
        />

        <TextareaMessage
          error={error}
          helpText={helpText}
          showCharacterCount={showCharacterCount}
          characterCount={characterCount}
          maxLength={maxLength}
        />
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
