/**
 * FormField Component
 * Wrapper component for form fields with label, error message, and help text
 */
import React from "react";

export interface FormFieldProps {
  /**
   * Field label
   */
  label?: string;
  /**
   * Error message
   */
  error?: string;
  /**
   * Help text
   */
  helpText?: string;
  /**
   * Mark field as required
   */
  required?: boolean;
  /**
   * Field ID for label association
   */
  htmlFor?: string;
  /**
   * Form field content (input, select, etc.)
   */
  children: React.ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Field Label Component
 */
const FieldLabel: React.FC<{
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
      {required && (
        <span className="text-red-500 ml-1" aria-label="required">
          *
        </span>
      )}
    </label>
  );
};

/**
 * Field Message Component
 */
const FieldMessage: React.FC<{
  error?: string;
  helpText?: string;
}> = ({ error, helpText }) => {
  if (error) {
    return (
      <p
        className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center"
        role="alert"
      >
        <svg
          className="w-4 h-4 mr-1 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
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
  }

  if (helpText) {
    return (
      <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
        {helpText}
      </p>
    );
  }

  return null;
};

/**
 * FormField Component
 *
 * A wrapper component that provides consistent layout for form fields with labels,
 * error messages, and help text. Use this to wrap custom inputs or third-party
 * form components.
 *
 * @example
 * ```tsx
 * <FormField
 *   label="Custom Field"
 *   error={errors.custom}
 *   helpText="Enter a value"
 *   required
 * >
 *   <CustomInput />
 * </FormField>
 *
 * <FormField label="Select Option">
 *   <select className="...">
 *     <option>Option 1</option>
 *     <option>Option 2</option>
 *   </select>
 * </FormField>
 * ```
 */
export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  helpText,
  required,
  htmlFor,
  children,
  className = "",
}) => {
  return (
    <div className={`w-full ${className}`}>
      <FieldLabel label={label} required={required} htmlFor={htmlFor} />

      <div>{children}</div>

      <FieldMessage error={error} helpText={helpText} />
    </div>
  );
};

FormField.displayName = "FormField";
