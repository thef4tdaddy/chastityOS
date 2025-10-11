import React from "react";

/**
 * Loading skeleton for relationship cards
 * Provides visual feedback while relationship data is loading
 */
export const RelationshipSkeleton: React.FC = () => {
  return (
    <div className="border rounded-lg p-4 border-gray-200 bg-white">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          {/* Title skeleton */}
          <div className="flex items-center gap-3">
            <div className="h-6 bg-gray-200 rounded relationship-skeleton w-48"></div>
            <div className="h-5 w-16 bg-gray-200 rounded relationship-skeleton"></div>
          </div>

          {/* Role text skeleton */}
          <div className="h-4 bg-gray-200 rounded relationship-skeleton w-32"></div>

          {/* Notes skeleton */}
          <div className="h-4 bg-gray-200 rounded relationship-skeleton w-64"></div>

          {/* Date skeleton */}
          <div className="h-3 bg-gray-200 rounded relationship-skeleton w-40"></div>
        </div>

        {/* Action buttons skeleton */}
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-gray-200 rounded relationship-skeleton"></div>
          <div className="h-8 w-8 bg-gray-200 rounded relationship-skeleton"></div>
          <div className="h-8 w-8 bg-gray-200 rounded relationship-skeleton"></div>
        </div>
      </div>
    </div>
  );
};

/**
 * Multiple skeleton cards for initial loading state
 */
export const RelationshipSkeletonList: React.FC<{ count?: number }> = ({
  count = 3,
}) => {
  return (
    <div className="space-y-4">
      <div className="h-7 bg-gray-200 rounded relationship-skeleton w-48 mb-4"></div>
      {Array.from({ length: count }).map((_, index) => (
        <RelationshipSkeleton key={index} />
      ))}
    </div>
  );
};
