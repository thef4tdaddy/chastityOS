/**
 * Pull to Refresh Component
 * Wraps content with pull-to-refresh functionality
 */
import React from 'react';
import { usePullToRefresh } from '../../hooks/mobile/usePullToRefresh';
import { useViewport } from '../../hooks/mobile/useViewport';

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void> | void;
  disabled?: boolean;
  threshold?: number;
  maxPullDistance?: number;
  className?: string;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  disabled = false,
  threshold = 80,
  maxPullDistance = 120,
  className = ''
}) => {
  const { isMobile } = useViewport();
  
  const {
    isRefreshing,
    isPulling,
    pullDistance,
    pullPercentage,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onScroll
  } = usePullToRefresh({
    onRefresh,
    disabled: disabled || !isMobile,
    threshold,
    maxPullDistance
  });

  const refreshIndicatorOpacity = Math.min(pullPercentage / 100, 1);
  const refreshIndicatorScale = Math.min(0.5 + (pullPercentage / 100) * 0.5, 1);

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onScroll={onScroll}
    >
      {/* Pull to refresh indicator */}
      {isMobile && (isPulling || isRefreshing) && (
        <div
          className="absolute top-0 left-1/2 transform -translate-x-1/2 z-10 transition-all duration-200 ease-out"
          style={{
            transform: `translateX(-50%) translateY(${Math.min(pullDistance - 40, 20)}px)`,
            opacity: isRefreshing ? 1 : refreshIndicatorOpacity
          }}
        >
          <div
            className="flex items-center justify-center w-10 h-10 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700"
            style={{
              transform: `scale(${isRefreshing ? 1 : refreshIndicatorScale})`
            }}
          >
            {isRefreshing ? (
              <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg
                className={`w-5 h-5 text-purple-500 transition-transform duration-200 ${
                  pullPercentage >= 100 ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Content with transform during pull */}
      <div
        className="transition-transform duration-200 ease-out"
        style={{
          transform: isPulling && !isRefreshing ? `translateY(${pullDistance * 0.5}px)` : 'translateY(0)'
        }}
      >
        {children}
      </div>

      {/* Loading overlay during refresh */}
      {isRefreshing && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse" />
      )}
    </div>
  );
};

export default PullToRefresh;