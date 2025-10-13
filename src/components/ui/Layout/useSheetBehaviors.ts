/**
 * Custom hooks for Sheet component behaviors
 */
import { useEffect, useRef } from "react";
import type React from "react";

/**
 * Hook to handle escape key press
 */
export const useEscapeKey = (
  isOpen: boolean,
  closeOnEscape: boolean,
  onClose: () => void,
) => {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
    // closeOnEscape is a boolean prop, not a store action - false positive
    // eslint-disable-next-line zustand-safe-patterns/zustand-no-store-actions-in-deps
  }, [isOpen, closeOnEscape]);
};

/**
 * Hook to prevent body scroll when sheet is open
 */
export const useScrollLock = (isOpen: boolean) => {
  useEffect(() => {
    if (!isOpen) return;

    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isOpen]);
};

/**
 * Hook to manage focus trap and focus restoration
 */
export const useFocusTrap = (
  isOpen: boolean,
  sheetRef: React.RefObject<HTMLDivElement | null>,
) => {
  const previousActiveElement = useRef<HTMLElement | null>(null);

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
  }, [isOpen, sheetRef]);
};
