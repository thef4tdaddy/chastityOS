/**
 * Mobile Input Component
 * Touch-optimized form input with mobile-specific enhancements
 */
import React, { forwardRef } from "react";

interface MobileInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
  helpText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "filled" | "borderless";
}

// Helper function to get size classes
const getSizeClasses = (size: "sm" | "md" | "lg") => {
  const sizeClasses = {
    sm: "h-10 px-3 text-sm",
    md: "h-12 px-4 text-base",
    lg: "h-14 px-5 text-lg",
  };
  return sizeClasses[size];
};

// Helper function to get variant classes
const getVariantClasses = (variant: "default" | "filled" | "borderless") => {
  const variantClasses = {
    default:
      "border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800",
    filled: "border-0 bg-gray-100 dark:bg-gray-700",
    borderless:
      "border-0 bg-transparent border-b-2 border-gray-300 dark:border-gray-600 rounded-none",
  };
  return variantClasses[variant];
};

// Helper function to get input mode based on type
const getInputMode = (type: string) => {
  if (type === "email") return "email" as const;
  if (type === "tel") return "tel" as const;
  if (type === "number") return "numeric" as const;
  if (type === "url") return "url" as const;
  return "text" as const;
};

// Helper function to get autocomplete value
const getAutoComplete = (type: string, autoComplete?: string) => {
  if (autoComplete) return autoComplete;
  if (type === "email") return "email";
  if (type === "tel") return "tel";
  if (type === "password") return "current-password";
  return "off";
};

// Helper function to build input classes
const buildInputClasses = (
  size: "sm" | "md" | "lg",
  variant: "default" | "filled" | "borderless",
  leftIcon?: React.ReactNode,
  rightIcon?: React.ReactNode,
  error?: string,
  className = ""
) => {
  return `
    w-full
    ${getSizeClasses(size)}
    ${getVariantClasses(variant)}
    ${leftIcon ? "pl-10" : ""}
    ${rightIcon ? "pr-10" : ""}
    ${error ? "border-red-500 focus:border-red-500" : "focus:border-purple-500"}
    ${variant !== "borderless" ? "rounded-lg" : ""}
    font-medium
    text-gray-900 dark:text-white
    placeholder-gray-500 dark:placeholder-gray-400
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-purple-500/20
    disabled:opacity-50 disabled:cursor-not-allowed
    ${className}
  `.trim();
};

export const MobileInput = forwardRef<HTMLInputElement, MobileInputProps>(
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
      type = "text",
      ...props
    },
    ref,
  ) => {
    const inputClasses = buildInputClasses(size, variant, leftIcon, rightIcon, error, className);

    // Mobile-specific input attributes
    const mobileInputProps = {
      ...props,
      // Prevent iOS zoom on focus
      style: { fontSize: "16px", ...props.style },
      // Set appropriate input modes for better mobile keyboards
      inputMode: getInputMode(type),
      // Optimize autocomplete
      autoComplete: getAutoComplete(type, props.autoComplete),
    };

    return (
      <div className="space-y-2">
        {/* Label */}
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="text-gray-400">{leftIcon}</div>
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            type={type}
            className={inputClasses}
            {...mobileInputProps}
          />

          {/* Right Icon */}
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <div className="text-gray-400">{rightIcon}</div>
            </div>
          )}
        </div>

        {/* Help Text */}
        {helpText && !error && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{helpText}</p>
        )}

        {/* Error Message */}
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
            <svg
              className="w-4 h-4 mr-1"
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
      </div>
    );
  },
);

MobileInput.displayName = "MobileInput";

export default MobileInput;
