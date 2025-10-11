/**
 * AccordionItem Component
 * Individual collapsible item within an Accordion
 */
import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccordionContext } from "./Accordion";

export interface AccordionItemProps {
  /**
   * Unique value for this item
   */
  value: string;
  /**
   * Title/header text
   */
  title: string;
  /**
   * Content to display when expanded
   */
  children: React.ReactNode;
  /**
   * Disable the item
   * @default false
   */
  disabled?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

// Size configurations for trigger
const triggerSizeClasses = {
  sm: "text-sm py-2 px-3",
  md: "text-base py-3 px-4",
  lg: "text-lg py-4 px-5",
};

// Size configurations for content
const contentSizeClasses = {
  sm: "text-sm px-3 pb-2",
  md: "text-base px-4 pb-3",
  lg: "text-lg px-5 pb-4",
};

/**
 * AccordionItem Component
 *
 * An individual collapsible section within an Accordion.
 * Must be used as a child of Accordion component.
 *
 * @example
 * ```tsx
 * <AccordionItem value="item-1" title="Section Title">
 *   <p>Your content here...</p>
 * </AccordionItem>
 *
 * <AccordionItem value="item-2" title="Disabled Section" disabled>
 *   <p>This content cannot be accessed</p>
 * </AccordionItem>
 * ```
 */
export const AccordionItem: React.FC<AccordionItemProps> = ({
  value,
  title,
  children,
  disabled = false,
  className = "",
}) => {
  const { expandedItems, toggleItem, variant, size } = useAccordionContext();
  const isExpanded = expandedItems.includes(value);
  const contentId = `accordion-content-${value}`;
  const triggerId = `accordion-trigger-${value}`;
  const contentRef = useRef<HTMLDivElement>(null);

  const handleClick = () => {
    if (!disabled) {
      toggleItem(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleItem(value);
    }
  };

  const variantClasses = {
    default: "",
    bordered: "",
    separated: "",
    flush: "",
  };

  const itemClasses = `
    ${variantClasses[variant]}
    ${className}
  `
    .trim()
    .replace(/\s+/g, " ");

  const triggerClasses = `
    w-full
    flex
    items-center
    justify-between
    ${triggerSizeClasses[size]}
    font-medium
    text-left
    transition-colors
    duration-200
    ${
      disabled
        ? "cursor-not-allowed opacity-50"
        : "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
    }
    focus:outline-none
    focus:ring-2
    focus:ring-purple-500
    focus:ring-inset
    ${variant === "bordered" || variant === "separated" ? "rounded-t-lg" : ""}
  `
    .trim()
    .replace(/\s+/g, " ");

  const iconClasses = `
    transition-transform
    duration-200
    ease-in-out
    ${isExpanded ? "rotate-180" : "rotate-0"}
    text-gray-500
    dark:text-gray-400
  `
    .trim()
    .replace(/\s+/g, " ");

  // Animation variants for content
  const contentVariants = {
    collapsed: {
      height: 0,
      opacity: 0,
      transition: {
        height: { duration: 0.2, ease: "easeIn" },
        opacity: { duration: 0.15, ease: "easeIn" },
      },
    },
    expanded: {
      height: "auto",
      opacity: 1,
      transition: {
        height: { duration: 0.2, ease: "easeOut" },
        opacity: { duration: 0.2, ease: "easeOut", delay: 0.05 },
      },
    },
  };

  return (
    <div className={itemClasses}>
      <button
        id={triggerId}
        className={triggerClasses}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-expanded={isExpanded}
        aria-controls={contentId}
        aria-disabled={disabled}
        disabled={disabled}
        type="button"
      >
        <span className="flex-1">{title}</span>
        <svg
          className={iconClasses}
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M4 6L8 10L12 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            id={contentId}
            ref={contentRef}
            role="region"
            aria-labelledby={triggerId}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={contentVariants}
            style={{ overflow: "hidden" }}
          >
            <div className={contentSizeClasses[size]}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

AccordionItem.displayName = "AccordionItem";
