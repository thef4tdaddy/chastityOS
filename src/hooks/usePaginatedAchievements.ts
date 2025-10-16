/**
 * Paginated Achievements Hook
 * Provides pagination support for large achievement lists
 */

import { useState, useMemo } from "react";

interface PaginationOptions {
  itemsPerPage?: number;
}

export function usePaginatedAchievements<T>(
  achievements: T[],
  options: PaginationOptions = {},
) {
  const { itemsPerPage = 12 } = options;
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(achievements.length / itemsPerPage);

  const paginatedAchievements = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return achievements.slice(startIndex, endIndex);
  }, [achievements, currentPage, itemsPerPage]);

  const goToPage = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Reset to page 1 when total pages changes and current page exceeds it
  useMemo(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  return {
    paginatedAchievements,
    currentPage,
    totalPages,
    itemsPerPage,
    totalItems: achievements.length,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    goToPage,
    nextPage,
    prevPage,
  };
}
