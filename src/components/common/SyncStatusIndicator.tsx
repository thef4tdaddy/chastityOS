/**
 * Sync Status Indicator
 * Shows the current sync status and connection state
 */
import React from "react";
import { useSyncContext } from "@/contexts/SyncContext";
import { connectionStatus } from "@/services/sync/connectionStatus";

export const SyncStatusIndicator: React.FC = () => {
  const { syncStatus, lastSyncTime, isSyncing, hasConflicts } =
    useSyncContext();
  const [isOnline, setIsOnline] = React.useState(
    connectionStatus.getIsOnline(),
  );

  React.useEffect(() => {
    const unsubscribe = connectionStatus.subscribe(setIsOnline);
    return unsubscribe;
  }, []);

  const getStatusColor = () => {
    if (!isOnline) return "text-red-400";
    if (hasConflicts) return "text-orange-400";
    if (syncStatus === "synced") return "text-green-400";
    if (syncStatus === "pending" || isSyncing) return "text-yellow-400";
    if (syncStatus === "error") return "text-red-400";
    return "text-gray-400";
  };

  const getStatusIcon = () => {
    if (!isOnline) return "⚠️";
    if (hasConflicts) return "⚠️";
    if (isSyncing) return "🔄";
    if (syncStatus === "synced") return "✅";
    if (syncStatus === "error") return "❌";
    return "⭕";
  };

  const getStatusText = () => {
    if (!isOnline) return "Offline";
    if (hasConflicts) return "Conflicts";
    if (isSyncing) return "Syncing...";
    if (syncStatus === "synced") return "Synced";
    if (syncStatus === "error") return "Error";
    return "Unknown";
  };

  const formatLastSync = () => {
    if (!lastSyncTime) return "Never";
    const now = new Date();
    const diff = now.getTime() - lastSyncTime.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return lastSyncTime.toLocaleDateString();
  };

  return (
    <div className="flex items-center space-x-2 text-xs">
      <span className={`${getStatusColor()}`}>
        {getStatusIcon()} {getStatusText()}
      </span>
      {isOnline && lastSyncTime && (
        <span className="text-gray-500">• Last: {formatLastSync()}</span>
      )}
      {!isOnline && (
        <span className="text-gray-500">• Changes will sync when online</span>
      )}
    </div>
  );
};
