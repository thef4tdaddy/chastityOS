/**
 * Achievement Pagination Component
 * Provides pagination controls for achievement lists
 */

import React from "react";
import { FaChevronLeft, FaChevronRight } from "../../utils/iconImport";
import { Button } from "@/components/ui";

interface AchievementPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onNextPage: () => void;
  onPrevPage: () => void;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const AchievementPaginationComponent: React.FC<AchievementPaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  onNextPage,
  onPrevPage,
  hasNextPage,
  hasPrevPage,
}) => {
  if (totalPages <= 1) {
    return null;
  }

  const renderPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page, last page, current page and neighbors
      pages.push(1);

      if (currentPage > 3) {
        pages.push("...");
      }

      for (
        let i = Math.max(2, currentPage - 1);
        i <= Math.min(totalPages - 1, currentPage + 1);
        i++
      ) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <nav
      className="flex items-center justify-center gap-2 mt-6 flex-wrap"
      aria-label="Achievement pagination"
    >
      <Button
        onClick={onPrevPage}
        disabled={!hasPrevPage}
        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="Previous page"
      >
        <FaChevronLeft aria-hidden="true" />
      </Button>

      {renderPageNumbers().map((page, index) => {
        if (page === "...") {
          return (
            <span
              key={`ellipsis-${index}`}
              className="px-2 text-nightly-celadon"
              aria-hidden="true"
            >
              ...
            </span>
          );
        }

        const pageNum = page as number;
        const isActive = pageNum === currentPage;

        return (
          <Button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={`
              px-3 py-2 rounded-lg min-w-[44px] min-h-[44px] transition-colors
              ${
                isActive
                  ? "bg-nightly-aquamarine text-black font-semibold"
                  : "bg-white/10 hover:bg-white/20 text-nightly-celadon"
              }
            `}
            aria-label={`Go to page ${pageNum}`}
            aria-current={isActive ? "page" : undefined}
          >
            {pageNum}
          </Button>
        );
      })}

      <Button
        onClick={onNextPage}
        disabled={!hasNextPage}
        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="Next page"
      >
        <FaChevronRight aria-hidden="true" />
      </Button>
    </nav>
  );
};

AchievementPaginationComponent.displayName = "AchievementPagination";
export const AchievementPagination = React.memo(AchievementPaginationComponent);

export default AchievementPagination;
