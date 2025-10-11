import { useState, useEffect } from "react";

/**
 * Custom hook for animating number counting up from 0 to target value
 * @param end - The target number to count up to
 * @param duration - Duration of the animation in milliseconds (default: 1000ms)
 * @param start - Starting number (default: 0)
 * @returns The current count value
 */
export const useCountUp = (
  end: number,
  duration: number = 1000,
  start: number = 0,
): number => {
  const [count, setCount] = useState(start);

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // If reduced motion is preferred or end value is 0, set immediately
    if (prefersReducedMotion || end === start) {
      setCount(end);
      return;
    }

    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);

      const currentCount = Math.floor(start + (end - start) * easeOut);
      setCount(currentCount);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [end, duration, start]);

  return count;
};
