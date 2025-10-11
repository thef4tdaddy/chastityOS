import React, { useState, useMemo, useCallback } from "react";
import type { DBTask, TaskStatus } from "../../types/database";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaTrophy,
  FaClock,
} from "../../utils/iconImport";
import { logger } from "../../utils/logging";

// Task status configuration type
interface TaskStatusConfig {
  icon: React.ReactNode;
  text: string;
  borderColor: string;
}

// Task priority styles type
interface TaskPriorityStyles {
  bgColor: string;
  textColor: string;
}

// Custom hook for task item logic
export const useTaskItem = (
  task: DBTask,
  onSubmit: (taskId: string, note: string, attachments?: string[]) => void,
) => {
  const [note, setNote] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<Error | null>(null);

  // Task status configuration logic
  const getStatusConfig = (status: TaskStatus): TaskStatusConfig => {
    switch (status) {
      case "pending":
        return {
          icon: <FaClock className="text-nightly-aquamarine" />,
          text: "Pending",
          borderColor: "border-nightly-aquamarine",
        };
      case "submitted":
        return {
          icon: <FaClock className="text-yellow-400" />,
          text: "Submitted",
          borderColor: "border-yellow-400",
        };
      case "approved":
        return {
          icon: <FaCheckCircle className="text-green-400" />,
          text: "Approved",
          borderColor: "border-green-400",
        };
      case "rejected":
        return {
          icon: <FaTimesCircle className="text-red-400" />,
          text: "Rejected",
          borderColor: "border-red-400",
        };
      case "completed":
        return {
          icon: <FaTrophy className="text-nightly-lavender-floral" />,
          text: "Completed",
          borderColor: "border-nightly-lavender-floral",
        };
      default:
        return {
          icon: <FaClock className="text-gray-400" />,
          text: "Unknown",
          borderColor: "border-gray-400",
        };
    }
  };

  // Priority styling logic
  const getPriorityStyles = (priority: string): TaskPriorityStyles => {
    switch (priority) {
      case "critical":
        return {
          bgColor: "bg-red-500/20",
          textColor: "text-red-300",
        };
      case "high":
        return {
          bgColor: "bg-orange-500/20",
          textColor: "text-orange-300",
        };
      case "medium":
        return {
          bgColor: "bg-yellow-500/20",
          textColor: "text-yellow-300",
        };
      default:
        return {
          bgColor: "bg-gray-500/20",
          textColor: "text-gray-300",
        };
    }
  };

  // Submit handler logic - memoized with useCallback
  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(task.id, note, attachments);
      setNote("");
      setAttachments([]);
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Failed to submit task");
      logger.error("Task submission error", {
        taskId: task.id,
        error: err.message,
        timestamp: new Date().toISOString(),
      });
      setSubmitError(err);
      throw err; // Re-throw to allow parent components to handle
    } finally {
      setIsSubmitting(false);
    }
  }, [task.id, note, attachments, onSubmit]);

  // Retry submission
  const retrySubmit = useCallback(() => {
    setSubmitError(null);
    return handleSubmit();
  }, [handleSubmit]);

  // Derived values - memoized with useMemo to prevent recalculation
  const statusConfig = useMemo(
    () => getStatusConfig(task.status),
    [task.status],
  );
  const priorityStyles = useMemo(
    () => (task.priority ? getPriorityStyles(task.priority) : null),
    [task.priority],
  );
  const isOverdue = useMemo(
    () => Boolean(task.dueDate && new Date() > task.dueDate),
    [task.dueDate],
  );

  return {
    // State
    note,
    attachments,
    isSubmitting,
    submitError,

    // Actions
    setNote,
    setAttachments,
    handleSubmit,
    retrySubmit,

    // Computed values
    statusConfig,
    priorityStyles,
    isOverdue,

    // Helper functions (exposed for flexibility)
    getStatusConfig,
    getPriorityStyles,
  };
};
