import React from "react";

interface SyncIssue {
  severity: "warning" | "error";
  message: string;
}

interface SyncIssueWarningProps {
  hasSyncIssue: boolean;
  isCriticalSyncIssue: boolean;
  syncIssue: SyncIssue | null;
}

export const SyncIssueWarning: React.FC<SyncIssueWarningProps> = ({
  hasSyncIssue,
  isCriticalSyncIssue,
  syncIssue,
}) => {
  if (!hasSyncIssue || !syncIssue) return null;

  return (
    <div
      className={`mx-4 mb-4 p-3 rounded-lg border ${
        isCriticalSyncIssue
          ? "bg-red-900/30 border-red-500/50"
          : "bg-yellow-900/30 border-yellow-500/50"
      }`}
    >
      <p
        className={`text-sm ${
          isCriticalSyncIssue ? "text-red-200" : "text-yellow-200"
        }`}
      >
        <strong>
          Timer Sync {syncIssue.severity === "error" ? "Error" : "Warning"}:
        </strong>{" "}
        {syncIssue.message}
      </p>
    </div>
  );
};
