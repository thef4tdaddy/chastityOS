/**
 * Task Skeleton Component
 * Loading skeleton for task items
 */
import React from "react";
import { Skeleton } from "../loading/SkeletonScreen";

interface TaskSkeletonProps {
  /**
   * Number of skeleton task items to render
   * @default 3
   */
  count?: number;
  /**
   * Whether to show the deadline section
   * @default true
   */
  showDeadline?: boolean;
  /**
   * Whether to show the submission section
   * @default true
   */
  showSubmission?: boolean;
}

/**
 * Single task item skeleton
 */
const TaskSkeletonItem: React.FC<{
  showDeadline: boolean;
  showSubmission: boolean;
}> = ({ showDeadline, showSubmission }) => (
  <div className="bg-white/10 backdrop-blur-sm border-l-4 border-gray-600 rounded-lg p-4 mb-4">
    {/* Header with status and deadline */}
    <div className="flex justify-between items-start mb-3">
      <div className="flex items-center gap-2">
        <Skeleton variant="circular" width={20} height={20} />
        <Skeleton width={100} height={16} />
      </div>
      {showDeadline && (
        <div className="text-right">
          <Skeleton width={80} height={12} className="mb-1" />
          <Skeleton width={120} height={16} />
        </div>
      )}
    </div>

    {/* Task title */}
    <div className="mb-3">
      <Skeleton width="80%" height={20} className="mb-2" />
      <Skeleton width="60%" height={14} />
    </div>

    {/* Metadata */}
    <div className="flex gap-4 mb-3">
      <Skeleton width={100} height={12} />
      <Skeleton width={100} height={12} />
    </div>

    {/* Submission section */}
    {showSubmission && (
      <div className="border-t border-white/10 pt-3">
        <Skeleton width="100%" height={60} className="mb-3" />
        <Skeleton width="100%" height={40} />
      </div>
    )}
  </div>
);

/**
 * TaskSkeleton Component
 *
 * Displays loading skeletons for task items while data is being fetched.
 *
 * @example
 * ```tsx
 * // Simple usage
 * <TaskSkeleton />
 *
 * // Custom count
 * <TaskSkeleton count={5} />
 *
 * // Without submission section (for archived tasks)
 * <TaskSkeleton count={3} showSubmission={false} />
 * ```
 */
export const TaskSkeleton: React.FC<TaskSkeletonProps> = ({
  count = 3,
  showDeadline = true,
  showSubmission = true,
}) => {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, i) => (
        <TaskSkeletonItem
          key={i}
          showDeadline={showDeadline}
          showSubmission={showSubmission}
        />
      ))}
    </div>
  );
};

TaskSkeleton.displayName = "TaskSkeleton";
