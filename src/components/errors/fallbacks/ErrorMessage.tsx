/**
 * ErrorMessage
 * Simple inline error message component
 */

import React from "react";
import { FaExclamationCircle, FaTimes } from "../../../utils/iconImport";
import { Button } from "@/components/ui";

interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
  variant?: "error" | "warning" | "info";
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onDismiss,
  className = "",
  variant = "error",
}) => {
  const variantStyles = {
    error: {
      bg: "bg-red-50 dark:bg-red-900/20",
      border: "border-red-200 dark:border-red-800",
      text: "text-red-800 dark:text-red-300",
      icon: "text-red-500",
    },
    warning: {
      bg: "bg-yellow-50 dark:bg-yellow-900/20",
      border: "border-yellow-200 dark:border-yellow-800",
      text: "text-yellow-800 dark:text-yellow-300",
      icon: "text-yellow-500",
    },
    info: {
      bg: "bg-blue-50 dark:bg-blue-900/20",
      border: "border-blue-200 dark:border-blue-800",
      text: "text-blue-800 dark:text-blue-300",
      icon: "text-blue-500",
    },
  };

  const styles = variantStyles[variant];

  return (
    <div
      className={`${styles.bg} border ${styles.border} rounded-lg p-3 flex items-start gap-2 ${className}`}
    >
      <FaExclamationCircle className={`w-4 h-4 ${styles.icon} flex-shrink-0 mt-0.5`} />
      <p className={`flex-1 text-sm ${styles.text}`}>{message}</p>
      {onDismiss && (
        <Button
          onClick={onDismiss}
          className={`${styles.text} hover:opacity-70 transition-opacity flex-shrink-0 p-0 bg-transparent border-0 min-h-0`}
          aria-label="Dismiss"
        >
          <FaTimes className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};
