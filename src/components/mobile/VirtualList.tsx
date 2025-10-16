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

// Empty State Component
const EmptyState: React.FC<{
  emptyComponent?: React.ReactNode;
  className: string;
}> = ({ emptyComponent, className }) => (
  <div className={`flex items-center justify-center h-32 ${className}`}>
    {emptyComponent || (
      <p className="text-gray-500 dark:text-gray-400 text-center">
        No items to display
      </p>
    )}
  </div>
);

// Loading Indicator Component
const LoadingIndicator: React.FC<{
  loadingComponent?: React.ReactNode;
}> = ({ loadingComponent }) => (
  <div className="flex items-center justify-center py-4">
    {loadingComponent || (
      <div className="flex items-center space-x-2 text-gray-500">
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        <span>Loading...</span>
      </div>
    )}
  </div>
);

// Virtual Items Container Component
const VirtualItemsContainer = <T,>({
  visibleItems,
  startIndex,
  itemHeight,
  renderItem,
}: {
  visibleItems: T[];
  startIndex: number;
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
}) => (
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
);

// Custom hook for virtual scrolling calculations
const useVirtualScrolling = <T,>(
  items: T[],
  itemHeight: number,
  overscan: number,
  scrollTop: number,
  containerHeight: number,
) => {
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan,
  );
  const visibleItems = items.slice(startIndex, endIndex + 1);

  return { startIndex, endIndex, visibleItems };
};

// Custom hook for scroll handling
const useScrollHandler = (
  containerHeight: number,
  onEndReached?: () => void,
  loading?: boolean,
  endReachedThreshold?: number,
) => {
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      const newScrollTop = target.scrollTop;

      // Check if we need to load more items
      if (onEndReached && !loading && endReachedThreshold) {
        const scrollRatio =
          (newScrollTop + containerHeight) / target.scrollHeight;
        if (scrollRatio >= endReachedThreshold) {
          onEndReached();
        }
      }

      return newScrollTop;
    },
    [containerHeight, onEndReached, loading, endReachedThreshold],
  );

  return handleScroll;
};

// Custom hook for container height management
const useContainerHeight = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);

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

  return { containerRef, containerHeight };
};

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
  const [scrollTop, setScrollTop] = useState(0);

  const { containerRef, containerHeight } = useContainerHeight();
  const { startIndex, visibleItems } = useVirtualScrolling(
    items,
    itemHeight,
    overscan,
    scrollTop,
    containerHeight,
  );

  const handleScrollEvent = useScrollHandler(
    containerHeight,
    onEndReached,
    loading,
    endReachedThreshold,
  );

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const newScrollTop = handleScrollEvent(e);
      setScrollTop(newScrollTop);
    },
    [handleScrollEvent],
  );

  // Mobile-specific optimizations
  const scrollerProps = isMobile
    ? {
        style: {
          WebkitOverflowScrolling: "touch" as const,
          transform: "translateZ(0)", // Enable hardware acceleration
        },
      }
    : {};

  if (items.length === 0 && !loading) {
    return <EmptyState emptyComponent={emptyComponent} className={className} />;
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
        <VirtualItemsContainer
          visibleItems={visibleItems}
          startIndex={startIndex}
          itemHeight={itemHeight}
          renderItem={renderItem}
        />
      </div>

      {/* Loading indicator */}
      {loading && <LoadingIndicator loadingComponent={loadingComponent} />}
    </div>
  );
}

export default VirtualList;
