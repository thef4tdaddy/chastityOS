/**
 * HeaderSyncIndicator Component
 * Compact sync indicator for app header/navigation
 */
import React from "react";
import { useSyncStatus } from "@/hooks/useSyncStatus";
import { SyncIndicator } from "@/components/ui/SyncIndicator";

interface HeaderSyncIndicatorProps {
  className?: string;
  showLabel?: boolean;
}

export const HeaderSyncIndicator: React.FC<HeaderSyncIndicatorProps> = ({
  className = "",
  showLabel = false,
}) => {
  const {
    status,
    isOnline,
    lastSyncedAt,
    pendingOperations,
    manualSync,
    errorMessage,
  } = useSyncStatus();

  const handleSync = async () => {
    try {
      await manualSync();
    } catch (error) {
      // Error is already logged by useSyncStatus
      // Silent fail - error will be shown in the UI
    }
  };

  return (
    <SyncIndicator
      status={status}
      lastSyncedAt={lastSyncedAt}
      onManualSync={handleSync}
      errorMessage={errorMessage}
      className={className}
      showLabel={showLabel}
      pendingCount={pendingOperations}
      isOnline={isOnline}
    />
  );
};
