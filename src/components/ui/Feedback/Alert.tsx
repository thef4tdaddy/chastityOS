/**
 * Alert Component
 * Alert messages for success, error, warning, and info
 */
import React from "react";

export interface AlertProps {
  /**
   * Alert variant
   * @default 'info'
   */
  variant?: "success" | "error" | "warning" | "info";
  /**
   * Alert title
   */
  title?: string;
  /**
   * Alert message
   */
  children: React.ReactNode;
  /**
   * Optional icon to display
   */
  icon?: React.ReactNode;
  /**
   * Show close button
   * @default false
   */
  dismissible?: boolean;
  /**
   * Close handler
   */
  onClose?: () => void;
  /**
   * Additional CSS classes
   */
  className?: string;
}

// Variant configurations
const variantClasses = {
  success: {
    container:
      "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    title: "text-green-800 dark:text-green-200",
    text: "text-green-700 dark:text-green-300",
    icon: "text-green-400 dark:text-green-500",
  },
  error: {
    container:
      "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
    title: "text-red-800 dark:text-red-200",
    text: "text-red-700 dark:text-red-300",
    icon: "text-red-400 dark:text-red-500",
  },
  warning: {
    container:
      "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
    title: "text-yellow-800 dark:text-yellow-200",
    text: "text-yellow-700 dark:text-yellow-300",
    icon: "text-yellow-400 dark:text-yellow-500",
  },
  info: {
    container:
      "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    title: "text-blue-800 dark:text-blue-200",
    text: "text-blue-700 dark:text-blue-300",
    icon: "text-blue-400 dark:text-blue-500",
  },
};

// Default icons for each variant
const DefaultIcon: React.FC<{ variant: keyof typeof variantClasses }> = ({
  variant,
}) => {
  const icons = {
    success: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clipRule="evenodd"
        />
      </svg>
    ),
  };

  return icons[variant];
};

/**
 * Alert Component
 *
 * Display contextual feedback messages with different severity levels.
 *
 * @example
 * ```tsx
 * <Alert variant="success" title="Success!">
 *   Your changes have been saved.
 * </Alert>
 *
 * <Alert variant="error" dismissible onClose={handleClose}>
 *   An error occurred while saving.
 * </Alert>
 *
 * <Alert variant="warning" icon={<CustomIcon />}>
 *   This action cannot be undone.
 * </Alert>
 * ```
 */
export const Alert: React.FC<AlertProps> = ({
  variant = "info",
  title,
  children,
  icon,
  dismissible = false,
  onClose,
  className = "",
}) => {
  const styles = variantClasses[variant];

  return (
    <div
      role="alert"
      className={`
        ${styles.container}
        border
        rounded-lg
        p-4
        ${className}
      `
        .trim()
        .replace(/\s+/g, " ")}
    >
      <div className="flex">
        <div className={`flex-shrink-0 ${styles.icon}`}>
          {icon || <DefaultIcon variant={variant} />}
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={`text-sm font-medium ${styles.title}`}>{title}</h3>
          )}
          <div className={`${title ? "mt-2" : ""} text-sm ${styles.text}`}>
            {children}
          </div>
        </div>
        {dismissible && onClose && (
          <div className="ml-auto pl-3">
            <button
              type="button"
              onClick={onClose}
              className={`
                inline-flex
                rounded-md
                p-1.5
                ${styles.icon}
                hover:bg-opacity-20
                focus:outline-none
                focus:ring-2
                focus:ring-offset-2
                focus:ring-purple-500
              `
                .trim()
                .replace(/\s+/g, " ")}
              aria-label="Dismiss"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

Alert.displayName = "Alert";
