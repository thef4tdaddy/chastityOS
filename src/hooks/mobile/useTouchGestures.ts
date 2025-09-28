/**
 * Touch Gestures Hook
 * Provides swipe, tap, and other touch interactions for mobile devices
 */
import { useCallback, useRef, useState } from "react";
import type { React } from "react";

interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

interface SwipeOptions {
  minDistance?: number;
  maxTime?: number;
  threshold?: number;
}

interface UseTouchGesturesReturn {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  isSwipeActive: boolean;
}

interface TouchGestureHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onTap?: () => void;
  onLongPress?: () => void;
}

export const useTouchGestures = (
  handlers: TouchGestureHandlers,
  options: SwipeOptions = {},
): UseTouchGesturesReturn => {
  const { minDistance = 50, maxTime = 1000, threshold = 30 } = options;

  const touchStart = useRef<TouchPoint | null>(null);
  const touchCurrent = useRef<TouchPoint | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isSwipeActive, setIsSwipeActive] = useState(false);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;

      const touchPoint: TouchPoint = {
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now(),
      };

      touchStart.current = touchPoint;
      touchCurrent.current = touchPoint;
      setIsSwipeActive(false);

      // Start long press timer
      if (handlers.onLongPress) {
        longPressTimer.current = setTimeout(() => {
          handlers.onLongPress?.();
        }, 500);
      }

      // Prevent default to avoid iOS bounce
      if (e.cancelable) {
        e.preventDefault();
      }
    },
    [handlers.onLongPress],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      if (!touch || !touchStart.current) return;

      touchCurrent.current = {
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now(),
      };

      const deltaX = Math.abs(touch.clientX - touchStart.current.x);
      const deltaY = Math.abs(touch.clientY - touchStart.current.y);

      // Clear long press if we've moved significantly
      if (deltaX > threshold || deltaY > threshold) {
        clearLongPressTimer();

        // Set swipe active if we've moved enough
        if (deltaX > minDistance || deltaY > minDistance) {
          setIsSwipeActive(true);
        }
      }

      // Prevent scrolling during horizontal swipes
      if (deltaX > deltaY && deltaX > threshold) {
        e.preventDefault();
      }
    },
    [minDistance, threshold, clearLongPressTimer],
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      clearLongPressTimer();

      if (!touchStart.current || !touchCurrent.current) {
        setIsSwipeActive(false);
        return;
      }

      const startPoint = touchStart.current;
      const endPoint = touchCurrent.current;
      const deltaTime = endPoint.timestamp - startPoint.timestamp;

      // Check if gesture was too slow
      if (deltaTime > maxTime) {
        setIsSwipeActive(false);
        touchStart.current = null;
        touchCurrent.current = null;
        return;
      }

      const deltaX = endPoint.x - startPoint.x;
      const deltaY = endPoint.y - startPoint.y;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      // Determine if it's a tap (small movement)
      if (absDeltaX < threshold && absDeltaY < threshold) {
        handlers.onTap?.();
        setIsSwipeActive(false);
        touchStart.current = null;
        touchCurrent.current = null;
        return;
      }

      // Determine swipe direction
      if (absDeltaX > absDeltaY && absDeltaX >= minDistance) {
        // Horizontal swipe
        if (deltaX > 0) {
          handlers.onSwipeRight?.();
        } else {
          handlers.onSwipeLeft?.();
        }
      } else if (absDeltaY >= minDistance) {
        // Vertical swipe
        if (deltaY > 0) {
          handlers.onSwipeDown?.();
        } else {
          handlers.onSwipeUp?.();
        }
      }

      setIsSwipeActive(false);
      touchStart.current = null;
      touchCurrent.current = null;
    },
    [handlers, maxTime, minDistance, threshold, clearLongPressTimer],
  );

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    isSwipeActive,
  };
};

/**
 * Simplified swipe hook for common use cases
 */
export const useSwipeGestures = (
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  options?: SwipeOptions,
) => {
  return useTouchGestures(
    {
      onSwipeLeft,
      onSwipeRight,
    },
    options,
  );
};

export default useTouchGestures;
