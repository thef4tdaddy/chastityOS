/**
 * SyncStatusPanel Component
 * Comprehensive sync status display with manual controls
 */
import React from "react";
import { useSyncStatus } from "@/hooks/useSyncStatus";
import { SyncIndicator } from "@/components/ui/SyncIndicator";
import { Button, Card } from "@/components/ui";
import { FaSync, FaTrash, FaRedo } from "@/utils/iconImport";

interface SyncStatusPanelProps {
  className?: string;
  showDetails?: boolean;
}

/**
 * Custom hooks for panel actions
 */
const useSyncActions = (
  manualSync: () => Promise<void>,
  retryFailed: () => Promise<void>,
  clearQueue: () => Promise<void>,
) => {
  const [syncing, setSyncing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleManualSync = React.useCallback(async () => {
    setSyncing(true);
    setError(null);
    try {
      await manualSync();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }, [manualSync]);

  const handleRetryFailed = React.useCallback(async () => {
    setSyncing(true);
    setError(null);
    try {
      await retryFailed();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Retry failed");
    } finally {
      setSyncing(false);
    }
  }, [retryFailed]);

  const handleClearQueue = React.useCallback(async () => {
    if (
      !window.confirm(
        "Are you sure you want to clear the sync queue? This will remove all pending operations.",
      )
    ) {
      return;
    }

    try {
      await clearQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear queue");
    }
  }, [clearQueue]);

  return {
    syncing,
    error,
    handleManualSync,
    handleRetryFailed,
    handleClearQueue,
  };
};

export const SyncStatusPanel: React.FC<SyncStatusPanelProps> = ({
  className = "",
  showDetails = true,
}) => {
  const syncStatus = useSyncStatus();
  const {
    status,
    isOnline,
    isSyncing,
    lastSyncedAt,
    queueStats,
    pendingOperations,
    failedOperations,
    errorMessage,
  } = syncStatus;

  const {
    syncing,
    error,
    handleManualSync,
    handleRetryFailed,
    handleClearQueue,
  } = useSyncActions(
    syncStatus.manualSync,
    syncStatus.retryFailed,
    syncStatus.clearQueue,
  );

  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-4">
        {/* Status Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-nightly-celadon">
            Sync Status
          </h3>
          <SyncIndicator
            status={status}
            lastSyncedAt={lastSyncedAt}
            isOnline={isOnline}
            pendingCount={pendingOperations}
            showLabel={false}
          />
        </div>

        {/* Connection Status */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400">Connection:</span>
          <span
            className={`font-medium ${isOnline ? "text-green-500" : "text-red-500"}`}
          >
            {isOnline ? "Online" : "Offline"}
          </span>
        </div>

        {/* Last Synced */}
        {lastSyncedAt && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">Last synced:</span>
            <span className="text-nightly-celadon">
              {lastSyncedAt.toLocaleString()}
            </span>
          </div>
        )}

        {/* Queue Statistics */}
        {showDetails && queueStats && (
          <div className="space-y-2 rounded-lg bg-nightly-charcoal p-3">
            <div className="text-sm font-medium text-nightly-celadon">
              Queue Statistics
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Total:</span>
                <span className="text-nightly-celadon">{queueStats.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Pending:</span>
                <span className="text-yellow-500">{queueStats.pending}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Failed:</span>
                <span className="text-red-500">{queueStats.failed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Processing:</span>
                <span className="text-blue-500">{queueStats.inProgress}</span>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {(error || errorMessage) && (
          <div className="rounded-lg bg-red-900/20 p-3 text-sm text-red-400">
            {error || errorMessage}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleManualSync}
            disabled={!isOnline || syncing || isSyncing}
            size="sm"
            variant="outline"
            className="flex items-center gap-2"
          >
            <FaSync
              className={`w-3 h-3 ${syncing || isSyncing ? "animate-spin" : ""}`}
            />
            {syncing || isSyncing ? "Syncing..." : "Sync Now"}
          </Button>

          {failedOperations > 0 && (
            <Button
              onClick={handleRetryFailed}
              disabled={!isOnline || syncing}
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
            >
              <FaRedo className="w-3 h-3" />
              Retry Failed ({failedOperations})
            </Button>
          )}

          {queueStats && queueStats.total > 0 && (
            <Button
              onClick={handleClearQueue}
              disabled={syncing}
              size="sm"
              variant="ghost"
              className="flex items-center gap-2 text-red-400 hover:text-red-300"
            >
              <FaTrash className="w-3 h-3" />
              Clear Queue
            </Button>
          )}
        </div>

        {/* Next Retry Info */}
        {queueStats?.nextRetryAt && (
          <div className="text-xs text-gray-500">
            Next retry: {new Date(queueStats.nextRetryAt).toLocaleTimeString()}
          </div>
        )}
      </div>
    </Card>
  );
};
