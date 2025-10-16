/**
 * Recurring Task Badge Component
 * Displays recurring indicator and information on task items
 */
import React from "react";
import type { DBTask } from "@/types/database";
import { FaSync } from "../../utils/iconImport";

interface RecurringTaskBadgeProps {
  task: DBTask;
  showInstanceNumber?: boolean;
}

export const RecurringTaskBadge: React.FC<RecurringTaskBadgeProps> = ({
  task,
  showInstanceNumber = true,
}) => {
  if (!task.isRecurring || !task.recurringConfig) return null;

  const { frequency, instanceNumber } = task.recurringConfig;

  const frequencyLabel: Record<string, string> = {
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    custom: "Custom",
  };

  return (
    <div className="flex items-center gap-1 text-xs text-blue-400">
      <FaSync className="animate-spin-slow" />
      <span>{frequencyLabel[frequency] || frequency}</span>
      {showInstanceNumber && instanceNumber && (
        <span className="text-gray-400">#{instanceNumber}</span>
      )}
    </div>
  );
};
