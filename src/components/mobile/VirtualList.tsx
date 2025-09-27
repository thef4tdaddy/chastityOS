/**
 * Virtual List Component
 * Optimized for mobile performance with large lists
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useViewport } from "../../hooks/mobile/useViewport";

interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight?: number;
  overscan?: number;
  className?: string;
  onEndReached?: () => void;
  endReachedThreshold?: number;
  loading?: boolean;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
}

export function VirtualList<T>({
  items,
  renderItem,
  itemHeight = 80,
  overscan = 5,
  className = "",
  onEndReached,
  endReachedThreshold = 0.8,
  loading = false,
  loadingComponent,
  emptyComponent,
}: VirtualListProps<T>) {
  const { isMobile } = useViewport();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan,
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);

  // Handle scroll with optimized performance for mobile
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      const newScrollTop = target.scrollTop;

      setScrollTop(newScrollTop);

      // Check if we need to load more items
      if (onEndReached && !loading) {
        const scrollRatio =
          (newScrollTop + containerHeight) / target.scrollHeight;
        if (scrollRatio >= endReachedThreshold) {
          onEndReached();
        }
      }
    },
    [containerHeight, onEndReached, loading, endReachedThreshold],
  );

  // Update container height on resize
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  // Mobile-specific optimizations
  const scrollerProps = isMobile
    ? {
        style: {
          WebkitOverflowScrolling: "touch",
          transform: "translateZ(0)", // Enable hardware acceleration
        },
      }
    : {};

  if (items.length === 0 && !loading) {
    return (
      <div className={`flex items-center justify-center h-32 ${className}`}>
        {emptyComponent || (
          <p className="text-gray-500 dark:text-gray-400 text-center">
            No items to display
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      onScroll={handleScroll}
      {...scrollerProps}
    >
      {/* Total height container */}
      <div
        style={{
          height: items.length * itemHeight,
          position: "relative",
        }}
      >
        {/* Visible items container */}
        <div
          style={{
            transform: `translateY(${startIndex * itemHeight}px)`,
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{
                height: itemHeight,
                overflow: "hidden",
              }}
              className="flex-shrink-0"
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="flex items-center justify-center py-4">
          {loadingComponent || (
            <div className="flex items-center space-x-2 text-gray-500">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Loading...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default VirtualList;
