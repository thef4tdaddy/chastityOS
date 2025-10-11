import { useState, useEffect } from "react";

/**
 * Custom hook to trigger staggered animations for a list of items
 * @param itemCount - Number of items to animate
 * @param delay - Delay between each item animation in milliseconds (default: 50ms)
 * @returns Array of boolean values indicating if each item should be visible
 */
export const useStaggerAnimation = (
  itemCount: number,
  delay: number = 50,
): boolean[] => {
  const [visibleItems, setVisibleItems] = useState<boolean[]>(
    new Array(itemCount).fill(false),
  );

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // If reduced motion is preferred, show all items immediately
    if (prefersReducedMotion) {
      setVisibleItems(new Array(itemCount).fill(true));
      return;
    }

    const timeouts: ReturnType<typeof setTimeout>[] = [];

    // Create staggered animations
    for (let i = 0; i < itemCount; i++) {
      const timeout = setTimeout(() => {
        setVisibleItems((prev) => {
          const newVisible = [...prev];
          newVisible[i] = true;
          return newVisible;
        });
      }, i * delay);

      timeouts.push(timeout);
    }

    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
    };
  }, [itemCount, delay]);

  return visibleItems;
};
