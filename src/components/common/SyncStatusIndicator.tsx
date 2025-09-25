/**
 * Sync Status Indicator
 * Shows the current sync status and connection state
 */
import React from "react";
import { useSyncStatus, useConnectionStatus } from "@/contexts/AppContext";

export const SyncStatusIndicator: React.FC = () => {
  const { syncStatus, lastSyncTime } = useSyncStatus();
  const { isOnline, connectionType } = useConnectionStatus();

  const getStatusColor = () => {
    if (!isOnline) return "text-red-400";
    if (syncStatus === "synced") return "text-green-400";
    if (syncStatus === "pending") return "text-yellow-400";
    if (syncStatus === "conflict") return "text-orange-400";
    return "text-gray-400";
  };

  const getStatusIcon = () => {
    if (!isOnline) return "⚠️";
    if (syncStatus === "synced") return "✅";
    if (syncStatus === "pending") return "🔄";
    if (syncStatus === "conflict") return "⚠️";
    return "⭕";
  };

  const getStatusText = () => {
    if (!isOnline) return "Offline";
    if (syncStatus === "synced") return "Synced";
    if (syncStatus === "pending") return "Syncing...";
    if (syncStatus === "conflict") return "Conflict";
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
      {connectionType && connectionType !== "unknown" && (
        <span className="text-gray-500">• {connectionType.toUpperCase()}</span>
      )}
    </div>
  );
};
