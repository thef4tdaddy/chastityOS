/**
 * Sheet Component
 * A unified component for bottom sheets, side drawers, and modal panels
 * with animations, gestures, and accessibility features
 */
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, PanInfo } from "framer-motion";

export interface SheetProps {
  /**
   * Controls sheet visibility
   */
  isOpen: boolean;
  /**
   * Callback when sheet should close
   */
  onClose: () => void;
  /**
   * Sheet side/position
   * @default 'bottom'
   */
  side?: "left" | "right" | "bottom";
  /**
   * Sheet size
   * @default 'md'
   */
  size?: "sm" | "md" | "lg" | "full";
  /**
   * Optional sheet title
   */
  title?: string;
  /**
   * Sheet content
   */
  children: React.ReactNode;
  /**
   * Whether to show the close button
   * @default true
   */
  showCloseButton?: boolean;
  /**
   * Whether clicking the overlay closes the sheet
   * @default true
   */
  closeOnOverlayClick?: boolean;
  /**
   * Whether pressing ESC key closes the sheet
   * @default true
   */
  closeOnEscape?: boolean;
  /**
   * Additional CSS classes for the sheet content
   */
  className?: string;
}

// Size variants for different sides
const sizeClasses = {
  bottom: {
    sm: "max-h-[40vh]",
    md: "max-h-[60vh]",
    lg: "max-h-[80vh]",
    full: "h-screen",
  },
  left: {
    sm: "max-w-xs",
    md: "max-w-md",
    lg: "max-w-2xl",
    full: "w-screen",
  },
  right: {
    sm: "max-w-xs",
    md: "max-w-md",
    lg: "max-w-2xl",
    full: "w-screen",
  },
};

// Animation variants
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const sheetVariants = {
  bottom: {
    hidden: { y: "100%" },
    visible: { y: 0 },
    exit: { y: "100%" },
  },
  left: {
    hidden: { x: "-100%" },
    visible: { x: 0 },
    exit: { x: "-100%" },
  },
  right: {
    hidden: { x: "100%" },
    visible: { x: 0 },
    exit: { x: "100%" },
  },
};

// Transition config
const springTransition = {
  type: "spring" as const,
  damping: 30,
  stiffness: 300,
};

const smoothTransition = {
  duration: 0.3,
  ease: [0.4, 0.0, 0.2, 1] as const,
};

/**
 * Sheet Header Component
 */
const SheetHeader: React.FC<{
  title?: string;
  showCloseButton: boolean;
  onClose: () => void;
}> = ({ title, showCloseButton, onClose }) => {
  if (!title && !showCloseButton) return null;

  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      {title && (
        <h2
          id="sheet-title"
          className="text-lg font-semibold text-gray-900 dark:text-white"
        >
          {title}
        </h2>
      )}
      {showCloseButton && (
        <button
          onClick={onClose}
          className="ml-auto p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          aria-label="Close sheet"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

/**
 * Drag Handle Component (for bottom sheets)
 */
const DragHandle: React.FC = () => (
  <div className="flex justify-center pt-3 pb-2">
    <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
  </div>
);

/**
 * Sheet Component
 */
export const Sheet: React.FC<SheetProps> = ({
  isOpen,
  onClose,
  side = "bottom",
  size = "md",
  title,
  children,
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className = "",
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

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

  // Prevent body scroll when sheet is open
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

    // Focus the sheet
    if (!sheetRef.current) return;

    const focusableElements = sheetRef.current.querySelectorAll(
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
      // Restore focus to the element that had it before the sheet opened
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen]);

  // Handle overlay click
  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  // Handle drag gesture (for bottom sheet)
  const handleDrag = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (side === "bottom" && info.offset.y > 0) {
      setDragOffset(info.offset.y);
    }
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100; // pixels
    if (side === "bottom" && info.offset.y > threshold) {
      onClose();
    }
    setDragOffset(0);
  };

  // Get container classes based on side
  const getContainerClasses = () => {
    const base = "fixed inset-0 z-50 flex";
    switch (side) {
      case "left":
        return `${base} items-stretch justify-start`;
      case "right":
        return `${base} items-stretch justify-end`;
      case "bottom":
      default:
        return `${base} items-end justify-center`;
    }
  };

  // Get sheet classes based on side and size
  const getSheetClasses = () => {
    const sizeClass = sizeClasses[side]?.[size] || sizeClasses.bottom.md;
    const baseClasses =
      "bg-white dark:bg-gray-900 shadow-xl overflow-hidden";

    switch (side) {
      case "left":
        return `${baseClasses} ${sizeClass} h-full w-full`;
      case "right":
        return `${baseClasses} ${sizeClass} h-full w-full`;
      case "bottom":
      default:
        return `${baseClasses} ${sizeClass} w-full rounded-t-3xl`;
    }
  };

  if (!isOpen) return null;

  const sheetContent = (
    <AnimatePresence>
      {isOpen && (
        <div className={getContainerClasses()}>
          {/* Overlay */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={smoothTransition}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleOverlayClick}
            aria-hidden="true"
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            variants={sheetVariants[side]}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={springTransition}
            drag={side === "bottom" ? "y" : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            style={
              side === "bottom" && dragOffset > 0
                ? { y: dragOffset }
                : undefined
            }
            className={`relative ${getSheetClasses()} ${className}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "sheet-title" : undefined}
          >
            {/* Drag handle for bottom sheets */}
            {side === "bottom" && <DragHandle />}

            {/* Header */}
            <SheetHeader
              title={title}
              showCloseButton={showCloseButton}
              onClose={onClose}
            />

            {/* Content */}
            <div className="overflow-y-auto flex-1 p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(sheetContent, document.body);
};

Sheet.displayName = "Sheet";
