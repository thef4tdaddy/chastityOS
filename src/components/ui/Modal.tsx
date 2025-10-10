/**
 * Modal Component
 * A standardized modal dialog with glass-morphism effects, accessibility features,
 * and consistent styling across the application.
 */
import React, { useEffect, useRef } from "react";
import { FaTimes } from "react-icons/fa";

export interface ModalProps {
  /** Controls modal visibility */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Optional modal title */
  title?: string;
  /** Optional icon to display next to title */
  icon?: React.ReactNode;
  /** Size variant of the modal */
  size?: "sm" | "md" | "lg" | "xl" | "full";
  /** Modal content */
  children: React.ReactNode;
  /** Optional footer content (typically action buttons) */
  footer?: React.ReactNode;
  /** Whether to show the close button in top-right corner */
  showCloseButton?: boolean;
  /** Whether clicking the backdrop closes the modal */
  closeOnBackdropClick?: boolean;
  /** Whether pressing ESC key closes the modal */
  closeOnEscape?: boolean;
  /** Optional additional className for the modal content */
  className?: string;
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-2xl",
  lg: "max-w-4xl",
  xl: "max-w-6xl",
  full: "max-w-7xl",
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  icon,
  size = "md",
  children,
  footer,
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className = "",
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Handle ESC key press
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isOpen]);

  // Focus trap and focus management
  useEffect(() => {
    if (!isOpen) return;

    // Store the currently focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Focus the modal
    if (!modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    if (focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus();
    }

    // Handle Tab key for focus trap
    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;

      const focusable = Array.from(focusableElements) as HTMLElement[];
      const firstFocusable = focusable[0];
      const lastFocusable = focusable[focusable.length - 1];

      if (
        firstFocusable &&
        event.shiftKey &&
        document.activeElement === firstFocusable
      ) {
        event.preventDefault();
        lastFocusable?.focus();
      } else if (
        lastFocusable &&
        !event.shiftKey &&
        document.activeElement === lastFocusable
      ) {
        event.preventDefault();
        firstFocusable?.focus();
      }
    };

    document.addEventListener("keydown", handleTab);

    return () => {
      document.removeEventListener("keydown", handleTab);
      // Restore focus to the element that had it before the modal opened
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen]);

  // Handle backdrop click
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdropClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="glass-modal fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div
        ref={modalRef}
        className={`glass-modal-content ${sizeClasses[size]} w-full max-h-[90vh] flex flex-col ${className}`}
      >
        {/* Header */}
        {(title || icon || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              {icon && <div className="flex-shrink-0">{icon}</div>}
              {title && (
                <h2
                  id="modal-title"
                  className="text-xl md:text-2xl font-bold text-white"
                >
                  {title}
                </h2>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="flex-shrink-0 p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                aria-label="Close modal"
              >
                <FaTimes size={20} />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="p-6 border-t border-white/10 bg-white/5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// Animation keyframes are already defined in src/index.css
// .glass-modal and .glass-modal-content classes are already defined
// .animate-fade-in needs to be added to the CSS if not present
