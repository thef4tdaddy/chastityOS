/**
 * Skeleton Screen Component
 * Provides skeleton loading states for better perceived performance
 * Phase 4: Advanced Optimizations - Progressive Loading
 */

import React from "react";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  variant = "text",
  width,
  height,
  animate = true,
}) => {
  const baseClasses = "bg-gray-300 dark:bg-gray-700";
  const animateClasses = animate ? "animate-pulse" : "";

  const variantClasses = {
    text: "rounded h-4",
    circular: "rounded-full",
    rectangular: "rounded",
  };

  const style: React.CSSProperties = {
    width: width || (variant === "text" ? "100%" : undefined),
    height: height || (variant === "circular" ? width : undefined),
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animateClasses} ${className}`}
      style={style}
    />
  );
};

interface SkeletonCardProps {
  lines?: number;
  showAvatar?: boolean;
  showActions?: boolean;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  lines = 3,
  showAvatar = false,
  showActions = false,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      {showAvatar && (
        <div className="flex items-center space-x-3 mb-4">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1">
            <Skeleton width="60%" height={16} className="mb-2" />
            <Skeleton width="40%" height={12} />
          </div>
        </div>
      )}

      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            width={i === lines - 1 ? "80%" : "100%"}
            height={12}
          />
        ))}
      </div>

      {showActions && (
        <div className="flex space-x-2 mt-4">
          <Skeleton width={80} height={32} variant="rectangular" />
          <Skeleton width={80} height={32} variant="rectangular" />
        </div>
      )}
    </div>
  );
};

interface SkeletonListProps {
  items?: number;
  showAvatar?: boolean;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({
  items = 5,
  showAvatar = true,
}) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg"
        >
          {showAvatar && <Skeleton variant="circular" width={48} height={48} />}
          <div className="flex-1 space-y-2">
            <Skeleton width="70%" height={16} />
            <Skeleton width="40%" height={12} />
          </div>
        </div>
      ))}
    </div>
  );
};

interface SkeletonDashboardProps {
  showCharts?: boolean;
  showStats?: boolean;
}

export const SkeletonDashboard: React.FC<SkeletonDashboardProps> = ({
  showCharts = true,
  showStats = true,
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton width="40%" height={32} className="mb-2" />
        <Skeleton width="60%" height={16} />
      </div>

      {/* Stats Grid */}
      {showStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow"
            >
              <Skeleton width="50%" height={16} className="mb-2" />
              <Skeleton width="70%" height={32} />
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      {showCharts && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <Skeleton width="30%" height={24} className="mb-4" />
          <Skeleton variant="rectangular" width="100%" height={300} />
        </div>
      )}

      {/* List */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <Skeleton width="30%" height={24} className="mb-4" />
        <SkeletonList items={3} />
      </div>
    </div>
  );
};

export default Skeleton;
