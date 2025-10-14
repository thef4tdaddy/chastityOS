/**
 * Paginated Session History Hook
 * Provides efficient pagination support for session history
 * Optimized for large datasets with lazy loading
 */
import { useState, useCallback, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { sessionDBService } from "../../services/database/SessionDBService";
import { serviceLogger } from "../../utils/logging";
import type { DBSession } from "../../types/database";

const logger = serviceLogger("useSessionHistoryPaginated");

export interface SessionHistoryPage {
  sessions: DBSession[];
  nextOffset: number | null;
  hasMore: boolean;
}

export interface UseSessionHistoryPaginatedOptions {
  pageSize?: number;
  enabled?: boolean;
}

export interface UseSessionHistoryPaginatedReturn {
  sessions: DBSession[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
  totalCount: number;
}

/**
 * Hook for paginated session history with infinite scroll support
 */
export function useSessionHistoryPaginated(
  userId: string | undefined,
  options: UseSessionHistoryPaginatedOptions = {},
): UseSessionHistoryPaginatedReturn {
  const { pageSize = 20, enabled = true } = options;
  const [totalCount, setTotalCount] = useState(0);

  // Use TanStack Query's infinite query for efficient pagination
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["sessions", "paginated", userId, pageSize],
    queryFn: async ({ pageParam = 0 }) => {
      if (!userId) {
        return {
          sessions: [],
          nextOffset: null,
          hasMore: false,
        };
      }

      logger.debug("Fetching session history page", {
        userId,
        offset: pageParam,
        pageSize,
      });

      // Fetch the page of sessions
      const sessions = await sessionDBService.getSessionHistory(
        userId,
        pageSize,
        pageParam,
      );

      // Update total count on first page load
      if (pageParam === 0) {
        const allSessions = await sessionDBService.findByUserId(userId);
        setTotalCount(allSessions.length);
      }

      const hasMore = sessions.length === pageSize;
      const nextOffset = hasMore ? pageParam + pageSize : null;

      return {
        sessions,
        nextOffset,
        hasMore,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    initialPageParam: 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    enabled: !!userId && enabled,
  });

  // Flatten all pages into a single array
  const sessions = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.sessions);
  }, [data]);

  // Callback to fetch next page
  const handleFetchNextPage = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return {
    sessions,
    isLoading,
    isFetchingNextPage,
    hasNextPage: hasNextPage ?? false,
    fetchNextPage: handleFetchNextPage,
    refetch,
    totalCount,
  };
}

/**
 * Hook for cursor-based pagination (alternative approach)
 * Useful when you need more control over pagination
 */
export function useSessionHistoryCursor(
  userId: string | undefined,
  options: UseSessionHistoryPaginatedOptions = {},
) {
  const { pageSize = 20, enabled = true } = options;
  const [offset, setOffset] = useState(0);

  const {
    data: sessions = [],
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["sessions", "cursor", userId, offset, pageSize],
    queryFn: async () => {
      if (!userId) return [];

      const sessions = await sessionDBService.getSessionHistory(
        userId,
        pageSize,
        offset,
      );

      logger.debug("Fetched session history cursor page", {
        userId,
        offset,
        count: sessions.length,
      });

      return sessions;
    },
    getNextPageParam: () => offset + pageSize,
    initialPageParam: 0,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    enabled: !!userId && enabled,
  });

  const nextPage = useCallback(() => {
    setOffset((prev) => prev + pageSize);
  }, [pageSize]);

  const prevPage = useCallback(() => {
    setOffset((prev) => Math.max(0, prev - pageSize));
  }, [pageSize]);

  const goToPage = useCallback(
    (page: number) => {
      setOffset(page * pageSize);
    },
    [pageSize],
  );

  return {
    sessions: sessions ?? [],
    isLoading,
    refetch,
    nextPage,
    prevPage,
    goToPage,
    currentPage: Math.floor(offset / pageSize),
    hasNextPage: Array.isArray(sessions) && sessions.length === pageSize,
    hasPrevPage: offset > 0,
  };
}
