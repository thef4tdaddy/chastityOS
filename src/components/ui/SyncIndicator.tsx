/**
 * Sync Indicator Component
 * Shows sync status and provides manual sync trigger
 * Part of Background Sync implementation (#392)
 */
import React from "react";
import { useSyncStatus } from "@/hooks/useSyncStatus";
import {
  FaSync,
  FaCheckCircle,
  FaExclamationTriangle,
} from "@/utils/iconImport";
import { Button } from "./Button";
import { formatDistanceToNow } from "date-fns";

type SyncStatus = "idle" | "syncing" | "synced" | "error";

export interface SyncIndicatorProps {
  /**
   * Show detailed stats (optional, defaults to false)
   */
  showStats?: boolean;
  /**
   * Show last sync time (optional, defaults to true)
   */
  showLastSync?: boolean;
  /**
   * Compact mode (smaller UI, defaults to false)
   */
  compact?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Get sync icon based on status
 */
const getSyncIcon = (
  isOnline: boolean,
  syncStatus: SyncStatus,
  compact: boolean,
) => {
  const iconSize = compact ? "text-sm" : "text-base";

  if (!isOnline) {
    return (
      <FaExclamationTriangle
        className={`${iconSize} text-yellow-500`}
        title="Offline"
      />
    );
  }

  switch (syncStatus) {
    case "syncing":
      return (
        <FaSync
          className={`${iconSize} text-blue-500 animate-spin`}
          title="Syncing..."
        />
      );
    case "synced":
      return (
        <FaCheckCircle
          className={`${iconSize} text-green-500`}
          title="Synced"
        />
      );
    case "error":
      return (
        <FaExclamationTriangle
          className={`${iconSize} text-red-500`}
          title="Sync error"
        />
      );
    default:
      return <FaSync className={`${iconSize} text-gray-400`} title="Idle" />;
  }
};

/**
 * Get sync status text
 */
const getSyncStatusText = (isOnline: boolean, syncStatus: SyncStatus) => {
  if (!isOnline) return "Offline";

  switch (syncStatus) {
    case "syncing":
      return "Syncing...";
    case "synced":
      return "Synced";
    case "error":
      return "Sync failed";
    default:
      return "Idle";
  }
};

/**
 * Get last sync time text
 */
const getLastSyncText = (lastSyncTime?: Date) => {
  if (!lastSyncTime) return "Never";
  try {
    return formatDistanceToNow(lastSyncTime, { addSuffix: true });
  } catch {
    return "Unknown";
  }
};

/**
 * Component to display sync status with manual sync button
 */
export const SyncIndicator: React.FC<SyncIndicatorProps> = ({
  showStats = false,
  showLastSync = true,
  compact = false,
  className = "",
}) => {
  const { syncStatus, stats, isOnline, lastSyncTime, triggerSync } =
    useSyncStatus();

  const [isSyncing, setIsSyncing] = React.useState(false);

  const handleManualSync = async () => {
    if (isSyncing || !isOnline) return;

    setIsSyncing(true);
    try {
      await triggerSync();
    } finally {
      setIsSyncing(false);
    }
  };

  const syncIcon = getSyncIcon(isOnline, syncStatus, compact);
  const statusText = getSyncStatusText(isOnline, syncStatus);
  const lastSyncText = getLastSyncText(lastSyncTime);

  if (compact) {
    const title = `${statusText}${showLastSync && lastSyncTime ? ` - Last sync: ${lastSyncText}` : ""}`;
    return (
      <div className={`flex items-center gap-2 ${className}`} title={title}>
        {syncIcon}
        <Button
          onClick={handleManualSync}
          disabled={isSyncing || !isOnline || syncStatus === "syncing"}
          className="p-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Sync now"
        >
          <FaSync className={isSyncing ? "animate-spin" : ""} />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg ${className}`}
    >
      {/* Status row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {syncIcon}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {statusText}
          </span>
        </div>
        <Button
          onClick={handleManualSync}
          disabled={isSyncing || !isOnline || syncStatus === "syncing"}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
        >
          {isSyncing ? "Syncing..." : "Sync Now"}
        </Button>
      </div>

      {/* Last sync time */}
      {showLastSync && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Last synced: {lastSyncText}
        </div>
      )}

      {/* Stats */}
      {showStats && stats && (
        <div className="text-xs text-gray-600 dark:text-gray-400 grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div>
            <div className="font-medium">Total</div>
            <div>{stats.total}</div>
          </div>
          <div>
            <div className="font-medium">Pending</div>
            <div>{stats.pending}</div>
          </div>
          <div>
            <div className="font-medium">Failed</div>
            <div>{stats.failed}</div>
          </div>
        </div>
      )}

      {/* Offline warning */}
      {!isOnline && (
        <div className="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
          You are offline. Changes will sync when connection is restored.
        </div>
      )}
    </div>
  );
};
