/**
 * SyncIndicator Component
 * Displays sync status and provides manual sync control
 */
import React, { useState, useEffect } from "react";
import { Spinner, Button, Tooltip } from "@/components/ui";
import { FaSync, FaCheck, FaExclamationTriangle } from "@/utils/iconImport";

export type SyncStatus = "syncing" | "synced" | "failed" | "idle";

export interface SyncIndicatorProps {
  status: SyncStatus;
  lastSyncedAt?: Date | null;
  onManualSync?: () => void;
  errorMessage?: string;
  className?: string;
  showLabel?: boolean;
}

export const SyncIndicator: React.FC<SyncIndicatorProps> = ({
  status,
  lastSyncedAt,
  onManualSync,
  errorMessage,
  className = "",
  showLabel = true,
}) => {
  // Use state to track current time for relative time calculations
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update current time every minute for relative time display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case "syncing":
        return <Spinner size="sm" className="text-nightly-spring-green" />;
      case "synced":
        return <FaCheck className="w-4 h-4 text-green-500" />;
      case "failed":
        return <FaExclamationTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <FaSync className="w-4 h-4 text-nightly-celadon" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "syncing":
        return "Syncing...";
      case "synced":
        return lastSyncedAt
          ? `Synced ${formatRelativeTime(lastSyncedAt)}`
          : "Synced";
      case "failed":
        return errorMessage || "Sync failed";
      default:
        return "Not synced";
    }
  };

  const getTooltipContent = () => {
    const baseText = getStatusText();
    if (status === "synced" && lastSyncedAt) {
      return `${baseText}\nLast sync: ${lastSyncedAt.toLocaleString()}`;
    }
    return baseText;
  };

  const formatRelativeTime = (date: Date): string => {
    const seconds = Math.floor((currentTime - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div
      className={`flex items-center gap-2 text-sm text-nightly-celadon ${className}`}
    >
      <Tooltip content={getTooltipContent()}>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          {showLabel && <span className="text-xs">{getStatusText()}</span>}
        </div>
      </Tooltip>

      {onManualSync && status !== "syncing" && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onManualSync}
          className="p-1 h-auto min-h-0"
          aria-label="Manual sync"
        >
          <FaSync className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
};
