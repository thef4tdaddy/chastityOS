/**
 * Accordion Component
 * Collapsible content sections with expand/collapse functionality
 */
import React, { createContext, useContext, useState, useCallback } from "react";

export interface AccordionProps {
  /**
   * Selection mode - single allows only one item open, multiple allows many
   * @default 'single'
   */
  type?: "single" | "multiple";
  /**
   * Default expanded item value(s) for uncontrolled mode
   */
  defaultValue?: string | string[];
  /**
   * Controlled expanded item value(s)
   */
  value?: string | string[];
  /**
   * Callback when expanded items change
   */
  onValueChange?: (value: string | string[]) => void;
  /**
   * Accordion items
   */
  children: React.ReactNode;
  /**
   * Visual variant
   * @default 'default'
   */
  variant?: "default" | "bordered" | "separated" | "flush";
  /**
   * Size variant
   * @default 'md'
   */
  size?: "sm" | "md" | "lg";
  /**
   * Additional CSS classes
   */
  className?: string;
}

interface AccordionContextValue {
  expandedItems: string[];
  toggleItem: (value: string) => void;
  type: "single" | "multiple";
  variant: "default" | "bordered" | "separated" | "flush";
  size: "sm" | "md" | "lg";
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

export const useAccordionContext = () => {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error("Accordion components must be used within an Accordion");
  }
  return context;
};

/**
 * Accordion Component
 *
 * A container for collapsible content sections.
 *
 * @example
 * ```tsx
 * // Single expand mode
 * <Accordion type="single" defaultValue="item-1">
 *   <AccordionItem value="item-1" title="Section 1">
 *     Content 1
 *   </AccordionItem>
 *   <AccordionItem value="item-2" title="Section 2">
 *     Content 2
 *   </AccordionItem>
 * </Accordion>
 *
 * // Multiple expand mode with variants
 * <Accordion type="multiple" variant="bordered" defaultValue={["item-1", "item-3"]}>
 *   <AccordionItem value="item-1" title="Section 1">
 *     Content 1
 *   </AccordionItem>
 *   <AccordionItem value="item-2" title="Section 2">
 *     Content 2
 *   </AccordionItem>
 *   <AccordionItem value="item-3" title="Section 3">
 *     Content 3
 *   </AccordionItem>
 * </Accordion>
 * ```
 */
export const Accordion: React.FC<AccordionProps> = ({
  type = "single",
  defaultValue,
  value: controlledValue,
  onValueChange,
  children,
  variant = "default",
  size = "md",
  className = "",
}) => {
  // Handle both controlled and uncontrolled modes
  const [uncontrolledValue, setUncontrolledValue] = useState<string[]>(() => {
    if (defaultValue === undefined) return [];
    return Array.isArray(defaultValue) ? defaultValue : [defaultValue];
  });

  const isControlled = controlledValue !== undefined;
  const expandedItems = isControlled
    ? Array.isArray(controlledValue)
      ? controlledValue
      : [controlledValue]
    : uncontrolledValue;

  const toggleItem = useCallback(
    (itemValue: string) => {
      // Get current expanded items at call time to avoid stale closures
      const currentExpanded = isControlled
        ? Array.isArray(controlledValue)
          ? controlledValue
          : [controlledValue]
        : uncontrolledValue;

      let newValue: string[];

      if (type === "single") {
        // In single mode, toggle the item or close if already open
        newValue = currentExpanded.includes(itemValue) ? [] : [itemValue];
      } else {
        // In multiple mode, toggle the item in the array
        newValue = currentExpanded.includes(itemValue)
          ? currentExpanded.filter((v) => v !== itemValue)
          : [...currentExpanded, itemValue];
      }

      if (isControlled) {
        // In controlled mode, call the callback
        onValueChange?.(type === "single" ? newValue[0] || "" : newValue);
      } else {
        // In uncontrolled mode, update internal state
        setUncontrolledValue(newValue);
        onValueChange?.(type === "single" ? newValue[0] || "" : newValue);
      }
    },
    [type, isControlled, controlledValue, uncontrolledValue, onValueChange],
  );

  const contextValue: AccordionContextValue = {
    expandedItems,
    toggleItem,
    type,
    variant,
    size,
  };

  const containerClasses = `
    ${variant === "separated" || variant === "bordered" || variant === "flush" ? "" : "border-t border-gray-200 dark:border-gray-700"}
    ${className}
  `
    .trim()
    .replace(/\s+/g, " ");

  return (
    <AccordionContext.Provider value={contextValue}>
      <div className={containerClasses}>{children}</div>
    </AccordionContext.Provider>
  );
};

Accordion.displayName = "Accordion";
