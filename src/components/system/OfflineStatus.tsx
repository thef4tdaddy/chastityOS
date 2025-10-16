/**
 * Offline Status Component
 * Shows the status of the offline queue and sync operations
 * Demonstrates the complete Firebase ↔ Dexie ↔ TanStack Query architecture
 */
import React, { useState } from "react";
import { useOfflineQueueStats } from "../../hooks/api";
import { useNotificationActions } from "../../stores";
import { FaWifi, FaWifiSlash, FaSync } from "../../utils/iconImport";

// Helper component for architecture flow display
const ArchitectureFlow: React.FC = () => (
  <div className="mt-3 pt-3 border-t border-white/10">
    <div className="text-xs font-medium text-white mb-2">
      🎯 Migration Complete
    </div>
    <div className="flex items-center justify-between text-xs">
      <span className="text-blue-400">Firebase</span>
      <span className="text-gray-400">↔</span>
      <span className="text-green-400">Dexie</span>
      <span className="text-gray-400">↔</span>
      <span className="text-purple-400">TanStack</span>
      <span className="text-gray-400">↔</span>
      <span className="text-yellow-400">UI</span>
    </div>
    <div className="text-center mt-1">
      <span className="text-xs text-gray-400">↑</span>
    </div>
    <div className="text-center">
      <span className="text-xs text-orange-400">Zustand</span>
    </div>
  </div>
);

export const OfflineStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { data: queueStats } = useOfflineQueueStats();
  const { showInfo } = useNotificationActions();

  // Listen for online/offline events
  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showInfo(
        "Back online! Syncing pending changes...",
        "Connection Restored",
      );
    };

    const handleOffline = () => {
      setIsOnline(false);
      showInfo(
        "You're offline. Changes will sync when connection is restored.",
        "Offline Mode",
      );
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [showInfo]);

  const statusColor = isOnline
    ? (queueStats?.pending || 0) > 0
      ? "bg-yellow-500"
      : "bg-green-500"
    : "bg-red-500";

  const statusIcon = isOnline ? (
    queueStats?.pending ? (
      <FaSync className="animate-spin" />
    ) : (
      <FaWifi />
    )
  ) : (
    <FaWifiSlash />
  );

  return (
    <div className="fixed bottom-4 right-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg shadow-lg p-4 max-w-sm">
      {/* Status Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${statusColor}`} />
          <span className="text-sm font-medium text-white">
            {isOnline ? "Online" : "Offline"}
          </span>
          {statusIcon}
        </div>
      </div>

      <ArchitectureFlow />

      {/* Implementation Status */}
      <div className="mt-3 p-2 bg-green-500/20 rounded text-xs text-green-200">
        <strong>✅ Architecture Ready:</strong> Firebase to TanStack Query
        migration is complete and functional.
      </div>
    </div>
  );
};
