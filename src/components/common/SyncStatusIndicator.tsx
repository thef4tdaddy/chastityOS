/**
 * Sync Status Indicator
 * Shows the current sync status and connection state
 */
import React from "react";
import { useSyncContext } from "@/contexts/SyncContext";
// TODO: Replace with proper hook pattern - temporarily using direct import
// import { connectionStatus } from "@/services/sync/connectionStatus";

export const SyncStatusIndicator: React.FC = () => {
  const { syncStatus, lastSyncTime, isSyncing, hasConflicts } =
    useSyncContext();
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
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
    if (!isOnline || syncStatus === "error") {
      return (
        <img
          src="/assets/sync-icon/sync-error.webp"
          alt="Sync Error"
          className="w-4 h-4 inline"
        />
      );
    }
    if (hasConflicts) {
      return (
        <img
          src="/assets/sync-icon/sync-error.webp"
          alt="Sync Conflicts"
          className="w-4 h-4 inline"
        />
      );
    }
    if (isSyncing) {
      return (
        <img
          src="/assets/sync-icon/sync-neutral.svg"
          alt="Syncing"
          className="w-4 h-4 inline animate-pulse"
        />
      );
    }
    if (syncStatus === "synced") {
      return (
        <img
          src="/assets/sync-icon/sync-good.svg"
          alt="Synced"
          className="w-4 h-4 inline"
        />
      );
    }
    return (
      <img
        src="/assets/sync-icon/sync-neutral.svg"
        alt="Unknown Status"
        className="w-4 h-4 inline"
      />
    );
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
    <div className="flex flex-col items-center text-xs">
      <span className={`${getStatusColor()}`}>{getStatusIcon()}</span>
      {isOnline && lastSyncTime && (
        <span className="text-gray-500 text-[10px] mt-1">
          {formatLastSync()}
        </span>
      )}
      {!isOnline && (
        <span className="text-gray-500 text-[10px] mt-1">Offline</span>
      )}
    </div>
  );
};
