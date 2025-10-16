/**
 * Input Component
 * Text input field with label, error states, and icons
 */
import React, { forwardRef, useId } from "react";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  /**
   * Input label
   */
  label?: string;
  /**
   * Error message to display
   */
  error?: string;
  /**
   * Help text to display below input
   */
  helpText?: string;
  /**
   * Icon to display on the left side
   */
  leftIcon?: React.ReactNode;
  /**
   * Icon to display on the right side
   */
  rightIcon?: React.ReactNode;
  /**
   * Input size
   * @default 'md'
   */
  size?: "sm" | "md" | "lg";
  /**
   * Input variant
   * @default 'default'
   */
  variant?: "default" | "filled";
}

// Size classes
const sizeClasses = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-base",
  lg: "h-12 px-5 text-lg",
};

// Variant classes
const variantClasses = {
  default:
    "border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800",
  filled: "border-2 border-transparent bg-gray-100 dark:bg-gray-700",
};

/**
 * Input Label Component
 */
const InputLabel: React.FC<{
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
 * Input Icon Component
 */
const InputIcon: React.FC<{
  icon: React.ReactNode;
  position: "left" | "right";
}> = ({ icon, position }) => (
  <div
    className={`absolute inset-y-0 ${position === "left" ? "left-0 pl-3" : "right-0 pr-3"} flex items-center pointer-events-none`}
  >
    <div className="text-gray-400">{icon}</div>
  </div>
);

/**
 * Input Message Component
 */
const InputMessage: React.FC<{
  error?: string;
  helpText?: string;
}> = ({ error, helpText }) => {
  if (error) {
    return (
      <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center">
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
 * Input Component
 *
 * @example
 * ```tsx
 * <Input
 *   label="Email"
 *   type="email"
 *   placeholder="you@example.com"
 *   required
 * />
 *
 * <Input
 *   label="Search"
 *   leftIcon={<SearchIcon />}
 *   placeholder="Search..."
 * />
 *
 * <Input
 *   label="Password"
 *   type="password"
 *   error="Password is required"
 * />
 * ```
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helpText,
      leftIcon,
      rightIcon,
      size = "md",
      variant = "default",
      className = "",
      id,
      required,
      ...props
    },
    ref,
  ) => {
    // Generate unique ID if not provided using React's useId hook
    const generatedId = useId();
    const inputId = id || generatedId;

    const inputClasses = `
      w-full
      ${sizeClasses[size]}
      ${variantClasses[variant]}
      ${leftIcon ? "pl-10" : ""}
      ${rightIcon ? "pr-10" : ""}
      ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "focus:border-purple-500 focus:ring-purple-500/20"}
      rounded-lg
      font-medium
      text-gray-900 dark:text-white
      placeholder-gray-500 dark:placeholder-gray-400
      transition-all duration-200 ease-in-out
      focus:outline-none focus:ring-2
      disabled:opacity-50 disabled:cursor-not-allowed
      ${className}
    `
      .trim()
      .replace(/\s+/g, " ");

    return (
      <div className="w-full">
        <InputLabel label={label} required={required} htmlFor={inputId} />

        <div className="relative">
          {leftIcon && <InputIcon icon={leftIcon} position="left" />}

          <input ref={ref} id={inputId} className={inputClasses} {...props} />

          {rightIcon && <InputIcon icon={rightIcon} position="right" />}
        </div>

        <InputMessage error={error} helpText={helpText} />
      </div>
    );
  },
);

Input.displayName = "Input";
