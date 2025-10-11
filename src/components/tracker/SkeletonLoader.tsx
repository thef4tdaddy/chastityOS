import React from "react";
import { Card } from "@/components/ui";

interface SkeletonLoaderProps {
  variant?: "stat" | "header" | "button";
  className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = "stat",
  className = "",
}) => {
  if (variant === "header") {
    return (
      <div
        className={`mb-4 p-4 rounded-lg skeleton-shimmer ${className}`}
        aria-label="Loading header"
      >
        <div className="h-6 bg-white/10 rounded w-3/4 mx-auto mb-3"></div>
        <div className="h-10 bg-white/10 rounded w-1/2 mx-auto"></div>
      </div>
    );
  }

  if (variant === "button") {
    return (
      <div
        className={`py-4 px-8 rounded-lg skeleton-shimmer ${className}`}
        aria-label="Loading button"
      >
        <div className="h-6 bg-white/10 rounded w-24 mx-auto"></div>
      </div>
    );
  }

  // Default stat card variant
  return (
    <Card
      variant="glass"
      padding="sm"
      className={`skeleton-shimmer ${className}`}
      aria-label="Loading statistics"
    >
      <div className="h-4 bg-white/10 rounded w-3/4 mb-3"></div>
      <div className="h-10 bg-white/10 rounded w-1/2 mb-2"></div>
      <div className="h-3 bg-white/10 rounded w-2/3"></div>
    </Card>
  );
};

// Pre-configured skeleton layouts for common tracker patterns
export const TrackerStatsLoading: React.FC = () => (
  <div className="space-y-6 mb-8">
    {/* Top stat card */}
    <SkeletonLoader variant="header" />

    {/* Current session stats */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <SkeletonLoader variant="stat" />
      <SkeletonLoader variant="stat" />
    </div>

    {/* Total stats */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <SkeletonLoader variant="stat" />
      <SkeletonLoader variant="stat" />
    </div>
  </div>
);

export const ActionButtonsLoading: React.FC = () => (
  <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center mb-6">
    <SkeletonLoader variant="button" />
  </div>
);
