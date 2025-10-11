/**
 * SyncIndicator Component
 * Displays sync status and provides manual sync control
 */
import React from "react";
import { Spinner, Button, Tooltip } from "@/components/ui";
import {
  FaSync,
  FaCheck,
  FaExclamationTriangle,
  FaWifi,
} from "@/utils/iconImport";

export type SyncStatus = "syncing" | "synced" | "failed" | "idle" | "offline";

export interface SyncIndicatorProps {
  status: SyncStatus;
  lastSyncedAt?: Date | null;
  onManualSync?: () => void;
  errorMessage?: string;
  className?: string;
  showLabel?: boolean;
  pendingCount?: number;
  isOnline?: boolean;
}

export const SyncIndicator: React.FC<SyncIndicatorProps> = ({
  status,
  lastSyncedAt,
  onManualSync,
  errorMessage,
  className = "",
  showLabel = true,
  pendingCount = 0,
  isOnline = true,
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case "offline":
        return <FaWifi className="w-4 h-4 text-gray-400" />;
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
      case "offline":
        return pendingCount > 0
          ? `Offline (${pendingCount} pending)`
          : "Offline";
      case "syncing":
        return pendingCount > 0 ? `Syncing (${pendingCount})` : "Syncing...";
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
    const details: string[] = [baseText];

    if (!isOnline) {
      details.push("Currently offline");
    }

    if (status === "synced" && lastSyncedAt) {
      details.push(`Last sync: ${lastSyncedAt.toLocaleString()}`);
    }

    if (pendingCount > 0) {
      details.push(`${pendingCount} operation(s) pending`);
    }

    if (status === "failed" && errorMessage) {
      details.push(`Error: ${errorMessage}`);
    }

    return details.join("\n");
  };

  const formatRelativeTime = (date: Date): string => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

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

      {onManualSync && status !== "syncing" && isOnline && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onManualSync}
          className="p-1 h-auto min-h-0"
          aria-label="Manual sync"
          disabled={status === "offline"}
        >
          <FaSync className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
};
