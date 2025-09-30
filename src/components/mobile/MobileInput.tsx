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

// Helper function to get input mode based on type
const getInputMode = (
  type: string,
): React.HTMLAttributes<HTMLInputElement>["inputMode"] => {
  switch (type) {
    case "email":
      return "email";
    case "tel":
      return "tel";
    case "number":
      return "numeric";
    case "url":
      return "url";
    default:
      return "text";
  }
};

// Helper function to get autocomplete value
const getAutoComplete = (
  type: string,
  existingAutoComplete?: string,
): string => {
  if (existingAutoComplete) return existingAutoComplete;

  switch (type) {
    case "email":
      return "email";
    case "tel":
      return "tel";
    case "password":
      return "current-password";
    default:
      return "off";
  }
};

// Helper function to get border and focus styles
const getBorderStyles = (error?: string): string => {
  if (error) return "border-red-500 focus:border-red-500";
  return "focus:border-purple-500";
};

// Helper function to get border radius
const getBorderRadius = (variant: string): string => {
  return variant !== "borderless" ? "rounded-lg" : "";
};

// Size and variant style mappings
const sizeClasses = {
  sm: "h-10 px-3 text-sm",
  md: "h-12 px-4 text-base",
  lg: "h-14 px-5 text-lg",
};

const variantClasses = {
  default:
    "border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800",
  filled: "border-0 bg-gray-100 dark:bg-gray-700",
  borderless:
    "border-0 bg-transparent border-b-2 border-gray-300 dark:border-gray-600 rounded-none",
};

// Input Label Component
const InputLabel: React.FC<{
  label?: string;
  required?: boolean;
}> = ({ label, required }) => {
  if (!label) return null;

  return (
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
};

// Input Icon Component
const InputIcon: React.FC<{
  icon: React.ReactNode;
  position: "left" | "right";
}> = ({ icon, position }) => (
  <div className={`absolute inset-y-0 ${position}-0 p${position === "left" ? "l" : "r"}-3 flex items-center pointer-events-none`}>
    <div className="text-gray-400">{icon}</div>
  </div>
);

// Input Message Component
const InputMessage: React.FC<{
  error?: string;
  helpText?: string;
}> = ({ error, helpText }) => {
  if (error) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
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
      <p className="text-sm text-gray-500 dark:text-gray-400">{helpText}</p>
    );
  }

  return null;
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
    const inputClasses = `
    w-full
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${leftIcon ? "pl-10" : ""}
    ${rightIcon ? "pr-10" : ""}
    ${getBorderStyles(error)}
    ${getBorderRadius(variant)}
    font-medium
    text-gray-900 dark:text-white
    placeholder-gray-500 dark:placeholder-gray-400
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-purple-500/20
    disabled:opacity-50 disabled:cursor-not-allowed
    ${className}
  `;

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
        <InputLabel label={label} required={props.required} />

        {/* Input Container */}
        <div className="relative">
          {leftIcon && <InputIcon icon={leftIcon} position="left" />}
          
          <input
            ref={ref}
            type={type}
            className={inputClasses}
            {...mobileInputProps}
          />
          
          {rightIcon && <InputIcon icon={rightIcon} position="right" />}
        </div>

        <InputMessage error={error} helpText={helpText} />
      </div>
    );
  },
);

MobileInput.displayName = "MobileInput";

export default MobileInput;
