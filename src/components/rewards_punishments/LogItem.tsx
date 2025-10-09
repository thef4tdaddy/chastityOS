import React, { memo, useMemo } from "react";
import {
  FaAward,
  FaGavel,
  FaClock,
  FaStickyNote,
  FaTrophy,
  FaExclamationTriangle,
} from "../../utils/iconImport";

// Mock reward/punishment log item interface
export interface RewardPunishmentLog {
  id: string;
  type: "reward" | "punishment";
  title: string;
  description: string;
  timeChangeSeconds: number; // Positive for added time, negative for removed time
  source:
    | "task_completion"
    | "keyholder_action"
    | "rule_violation"
    | "milestone";
  sourceId?: string; // Reference to task, rule, etc.
  createdAt: Date;
  notes?: string;
}

// Helper functions
const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

const getSourceIcon = (source: RewardPunishmentLog["source"]) => {
  switch (source) {
    case "task_completion":
      return <FaTrophy className="text-nightly-aquamarine" />;
    case "keyholder_action":
      return <FaGavel className="text-nightly-lavender-floral" />;
    case "rule_violation":
      return <FaExclamationTriangle className="text-red-400" />;
    case "milestone":
      return <FaAward className="text-nightly-spring-green" />;
    default:
      return <FaClock />;
  }
};

// Log Item Component
interface LogItemProps {
  item: RewardPunishmentLog;
}

const LogItemComponent: React.FC<LogItemProps> = ({ item }) => {
  const isReward = item.type === "reward";
  const timeChange = Math.abs(item.timeChangeSeconds);

  // Memoize formatted duration to avoid recalculation
  const formattedDuration = useMemo(
    () => formatDuration(timeChange),
    [timeChange],
  );

  // Memoize source icon to avoid recalculation
  const sourceIcon = useMemo(() => getSourceIcon(item.source), [item.source]);

  // Memoize formatted date to avoid recalculation
  const formattedTimestamp = useMemo(
    () =>
      `${item.createdAt.toLocaleDateString()} ${item.createdAt.toLocaleTimeString()}`,
    [item.createdAt],
  );

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {isReward ? (
            <FaAward className="text-green-400 text-xl" />
          ) : (
            <FaGavel className="text-red-400 text-xl" />
          )}
          <div>
            <h3 className="font-medium text-nightly-honeydew">{item.title}</h3>
            <p className="text-sm text-nightly-celadon">{item.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {sourceIcon}
          <span
            className={`px-2 py-1 text-xs rounded ${
              isReward
                ? "bg-green-500/20 text-green-300"
                : "bg-red-500/20 text-red-300"
            }`}
          >
            {isReward ? "REWARD" : "PUNISHMENT"}
          </span>
        </div>
      </div>

      {/* Time Impact */}
      {item.timeChangeSeconds !== 0 && (
        <div
          className={`flex items-center gap-2 mb-3 ${
            isReward ? "text-green-400" : "text-red-400"
          }`}
        >
          <FaClock />
          <span className="font-mono">
            {formattedDuration} {isReward ? "removed from" : "added to"}{" "}
            chastity time
          </span>
        </div>
      )}

      {/* Notes */}
      {item.notes && (
        <div className="bg-white/5 rounded p-2 mb-3">
          <div className="flex items-center gap-2 text-nightly-celadon">
            <FaStickyNote />
            <span className="text-sm">{item.notes}</span>
          </div>
        </div>
      )}

      {/* Timestamp */}
      <div className="text-xs text-nightly-celadon text-right">
        {formattedTimestamp}
      </div>
    </div>
  );
};

// Memoize LogItem to prevent unnecessary re-renders
export const LogItem = memo(LogItemComponent);
