/**
 * Pull to Refresh Hook
 * Provides pull-to-refresh functionality for mobile devices
 */
import { useCallback, useRef, useState, useEffect } from "react";
import type { React } from "react";
import { useHapticFeedback } from "./useHapticFeedback";
import { logger } from "../../utils/logging";

interface PullToRefreshOptions {
  threshold?: number;
  maxPullDistance?: number;
  onRefresh: () => Promise<void> | void;
  disabled?: boolean;
}

interface PullToRefreshReturn {
  isRefreshing: boolean;
  isPulling: boolean;
  pullDistance: number;
  pullPercentage: number;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onScroll: (e: React.UIEvent) => void;
}

export const usePullToRefresh = ({
  threshold = 80,
  maxPullDistance = 120,
  onRefresh,
  disabled = false,
}: PullToRefreshOptions): PullToRefreshReturn => {
  const { light: hapticLight, success: hapticSuccess } = useHapticFeedback();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [_scrollTop, setScrollTop] = useState(0);

  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const isAtTop = useRef<boolean>(true);
  const hasTriggeredHaptic = useRef<boolean>(false);

  const pullPercentage = Math.min((pullDistance / threshold) * 100, 100);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || isRefreshing) return;

      const touch = e.touches[0];
      if (!touch) return;

      startY.current = touch.clientY;
      currentY.current = touch.clientY;
      hasTriggeredHaptic.current = false;
    },
    [disabled, isRefreshing],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || isRefreshing || !isAtTop.current) return;

      const touch = e.touches[0];
      if (!touch) return;

      currentY.current = touch.clientY;
      const deltaY = currentY.current - startY.current;

      if (deltaY > 0) {
        // Pulling down
        const distance = Math.min(deltaY * 0.5, maxPullDistance); // Apply resistance
        setPullDistance(distance);
        setIsPulling(distance > 10);

        // Haptic feedback when threshold is reached
        if (distance >= threshold && !hasTriggeredHaptic.current) {
          hapticLight();
          hasTriggeredHaptic.current = true;
        }

        // Prevent default scrolling when pulling
        if (deltaY > 10) {
          e.preventDefault();
        }
      } else {
        setPullDistance(0);
        setIsPulling(false);
      }
    },
    [disabled, isRefreshing, threshold, maxPullDistance, hapticLight],
  );

  const handleTouchEnd = useCallback(async () => {
    if (disabled || isRefreshing) return;

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      hapticSuccess();

      try {
        await onRefresh();
      } catch (error) {
        logger.error("Pull to refresh failed", { error }, "usePullToRefresh");
      } finally {
        setIsRefreshing(false);
      }
    }

    setPullDistance(0);
    setIsPulling(false);
    hasTriggeredHaptic.current = false;
  }, [
    disabled,
    isRefreshing,
    pullDistance,
    threshold,
    onRefresh,
    hapticSuccess,
  ]);

  const handleScroll = useCallback(
    (e: React.UIEvent) => {
      const target = e.currentTarget as HTMLElement;
      const scrollTop = target.scrollTop;
      setScrollTop(scrollTop);
      isAtTop.current = scrollTop <= 0;

      // Reset pull state when scrolling away from top
      if (scrollTop > 0 && isPulling) {
        setPullDistance(0);
        setIsPulling(false);
      }
    },
    [isPulling],
  );

  // Reset states when disabled changes
  useEffect(() => {
    if (disabled) {
      setPullDistance(0);
      setIsPulling(false);
      setIsRefreshing(false);
    }
  }, [disabled]);

  return {
    isRefreshing,
    isPulling,
    pullDistance,
    pullPercentage,
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onScroll: handleScroll,
  };
};
