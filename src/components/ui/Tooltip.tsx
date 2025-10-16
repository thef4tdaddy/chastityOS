/**
 * Tooltip Component
 * Display helpful information on hover or focus
 */
import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

export interface TooltipProps {
  /**
   * Tooltip content to display
   */
  content: React.ReactNode;
  /**
   * Element that triggers the tooltip
   */
  children: React.ReactNode;
  /**
   * Tooltip placement
   * @default 'top'
   */
  placement?: "top" | "bottom" | "left" | "right";
  /**
   * Delay before showing tooltip (in milliseconds)
   * @default 300
   */
  delay?: number;
  /**
   * Disable the tooltip
   * @default false
   */
  disabled?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

// Offset from the trigger element
const TOOLTIP_OFFSET = 8;

// Viewport padding to prevent overflow
const VIEWPORT_PADDING = 10;

/**
 * Calculate tooltip position
 */
const calculatePosition = (
  triggerRect: DOMRect,
  tooltipRect: DOMRect,
  placement: "top" | "bottom" | "left" | "right",
): {
  top: number;
  left: number;
  actualPlacement: "top" | "bottom" | "left" | "right";
} => {
  let top = 0;
  let left = 0;
  let actualPlacement: "top" | "bottom" | "left" | "right" = placement;

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Calculate initial position based on placement
  switch (placement) {
    case "top":
      top = triggerRect.top - tooltipRect.height - TOOLTIP_OFFSET;
      left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
      break;
    case "bottom":
      top = triggerRect.bottom + TOOLTIP_OFFSET;
      left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
      break;
    case "left":
      top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
      left = triggerRect.left - tooltipRect.width - TOOLTIP_OFFSET;
      break;
    case "right":
      top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
      left = triggerRect.right + TOOLTIP_OFFSET;
      break;
  }

  // Auto-adjust if tooltip would go off-screen
  // Check vertical overflow
  if (placement === "top" && top < VIEWPORT_PADDING) {
    // Switch to bottom if not enough space on top
    top = triggerRect.bottom + TOOLTIP_OFFSET;
    actualPlacement = "bottom";
  } else if (
    placement === "bottom" &&
    top + tooltipRect.height > viewportHeight - VIEWPORT_PADDING
  ) {
    // Switch to top if not enough space on bottom
    top = triggerRect.top - tooltipRect.height - TOOLTIP_OFFSET;
    actualPlacement = "top";
  }

  // Check horizontal overflow
  if (left < VIEWPORT_PADDING) {
    left = VIEWPORT_PADDING;
  } else if (left + tooltipRect.width > viewportWidth - VIEWPORT_PADDING) {
    left = viewportWidth - tooltipRect.width - VIEWPORT_PADDING;
  }

  // For left/right placement, check if we need to switch
  if (placement === "left" && left < VIEWPORT_PADDING) {
    left = triggerRect.right + TOOLTIP_OFFSET;
    actualPlacement = "right";
  } else if (
    placement === "right" &&
    left + tooltipRect.width > viewportWidth - VIEWPORT_PADDING
  ) {
    left = triggerRect.left - tooltipRect.width - TOOLTIP_OFFSET;
    actualPlacement = "left";
  }

  return { top, left, actualPlacement };
};

/**
 * Tooltip Content Component (rendered in portal)
 */
const TooltipContent: React.FC<{
  content: React.ReactNode;
  triggerRect: DOMRect | null;
  placement: "top" | "bottom" | "left" | "right";
  isVisible: boolean;
}> = ({ content, triggerRect, placement, isVisible }) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [actualPlacement, setActualPlacement] = useState<
    "top" | "bottom" | "left" | "right"
  >(placement);

  useEffect(() => {
    if (triggerRect && tooltipRef.current && isVisible) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const {
        top,
        left,
        actualPlacement: newPlacement,
      } = calculatePosition(triggerRect, tooltipRect, placement);
      setPosition({ top, left });
      setActualPlacement(newPlacement);
    }
  }, [triggerRect, placement, isVisible]);

  if (!isVisible || !triggerRect) return null;

  return createPortal(
    <div
      ref={tooltipRef}
      role="tooltip"
      className={`
        fixed z-[9999] px-3 py-2 text-sm font-medium text-white
        bg-gray-900 dark:bg-gray-800 rounded-lg shadow-lg
        pointer-events-none
        transition-opacity duration-200
        opacity-100
      `}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      data-placement={actualPlacement}
    >
      {content}
      {/* Arrow */}
      <div
        className={`
          absolute w-2 h-2 bg-gray-900 dark:bg-gray-800 transform rotate-45
          ${actualPlacement === "top" ? "bottom-[-4px] left-1/2 -translate-x-1/2" : ""}
          ${actualPlacement === "bottom" ? "top-[-4px] left-1/2 -translate-x-1/2" : ""}
          ${actualPlacement === "left" ? "right-[-4px] top-1/2 -translate-y-1/2" : ""}
          ${actualPlacement === "right" ? "left-[-4px] top-1/2 -translate-y-1/2" : ""}
        `}
      />
    </div>,
    document.body,
  );
};

/**
 * Tooltip Component
 *
 * Display helpful information on hover or focus.
 * Automatically adjusts position if it would go off-screen.
 *
 * @example
 * ```tsx
 * <Tooltip content="This is helpful information">
 *   <button>Hover me</button>
 * </Tooltip>
 *
 * <Tooltip content="Complex content" placement="right" delay={500}>
 *   <IconButton icon={<InfoIcon />} aria-label="Info" />
 * </Tooltip>
 * ```
 */
export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  placement = "top",
  delay = 300,
  disabled = false,
  className = "",
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const showTooltip = () => {
    if (disabled || !triggerRef.current) return;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (rect) {
        setTriggerRect(rect);
        setIsVisible(true);
      }
    }, delay);
  };

  const hideTooltip = () => {
    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setIsVisible(false);
  };

  const handleMouseEnter = () => {
    showTooltip();
  };

  const handleMouseLeave = () => {
    hideTooltip();
  };

  const handleFocus = () => {
    showTooltip();
  };

  const handleBlur = () => {
    hideTooltip();
  };

  // Update trigger rect on scroll/resize
  useEffect(() => {
    if (!isVisible) return;

    const updateRect = () => {
      if (triggerRef.current) {
        setTriggerRect(triggerRef.current.getBoundingClientRect());
      }
    };

    window.addEventListener("scroll", updateRect, true);
    window.addEventListener("resize", updateRect);

    return () => {
      window.removeEventListener("scroll", updateRect, true);
      window.removeEventListener("resize", updateRect);
    };
  }, [isVisible]);

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={`inline-block ${className}`}
      >
        {children}
      </div>
      <TooltipContent
        content={content}
        triggerRect={triggerRect}
        placement={placement}
        isVisible={isVisible}
      />
    </>
  );
};

Tooltip.displayName = "Tooltip";
