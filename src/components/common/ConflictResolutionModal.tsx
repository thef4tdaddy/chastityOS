/**
 * Conflict Resolution Modal
 * User interface for resolving data sync conflicts
 */
import React, { useState } from "react";
import type { ConflictInfo } from "@/types/database";
import { Modal } from "@/components/ui";

interface ConflictResolutionProps {
  conflicts: ConflictInfo[];
  onResolve: (resolutions: Record<string, "local" | "remote">) => void;
  onCancel: () => void;
  isOpen: boolean;
}

const formatTimestamp = (date: Date): string => {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
};

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined) return "Not set";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
};

const getDeviceLabel = (isLocal: boolean): string => {
  return isLocal ? "This Device" : "Other Device";
};

// Version Option Component
interface VersionOptionProps {
  conflictId: string;
  isLocal: boolean;
  data: unknown;
  timestamp: Date;
  isSelected: boolean;
  onSelect: () => void;
}

const VersionOption: React.FC<VersionOptionProps> = ({
  conflictId,
  isLocal,
  data,
  timestamp,
  isSelected,
  onSelect,
}) => (
  <label className="cursor-pointer">
    <input
      type="radio"
      name={conflictId}
      value={isLocal ? "local" : "remote"}
      checked={isSelected}
      onChange={onSelect}
      className="sr-only"
    />
    <div
      className={`border-2 rounded-lg p-4 transition-colors ${
        isSelected
          ? "border-purple-500 bg-purple-500/10"
          : "border-gray-600 hover:border-purple-400"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-purple-300">
          {getDeviceLabel(isLocal)}
        </span>
        <span className="text-sm text-gray-400">
          {formatTimestamp(timestamp)}
        </span>
      </div>

      <div className="bg-gray-900 rounded p-3 text-sm">
        <pre className="whitespace-pre-wrap text-gray-300 overflow-x-auto">
          {formatValue(data)}
        </pre>
      </div>
    </div>
  </label>
);

// Conflict Item Component
interface ConflictItemProps {
  conflict: ConflictInfo;
  index: number;
  resolution: "local" | "remote" | undefined;
  onResolutionChange: (
    conflictId: string,
    resolution: "local" | "remote",
  ) => void;
}

const ConflictItem: React.FC<ConflictItemProps> = ({
  conflict,
  index,
  resolution,
  onResolutionChange,
}) => {
  const conflictId = `${conflict.collection}-${conflict.documentId}-${index}`;
  const localTimestamp = new Date(conflict.localData.lastModified as string);
  const remoteTimestamp = new Date(conflict.remoteData.lastModified as string);

  return (
    <div className="border border-gray-700 rounded-lg p-4">
      <h3 className="text-lg font-medium text-purple-200 mb-3">
        {conflict.collection.charAt(0).toUpperCase() +
          conflict.collection.slice(1)}{" "}
        Conflict
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <VersionOption
          conflictId={conflictId}
          isLocal={true}
          data={conflict.localData}
          timestamp={localTimestamp}
          isSelected={resolution === "local"}
          onSelect={() => onResolutionChange(conflictId, "local")}
        />
        <VersionOption
          conflictId={conflictId}
          isLocal={false}
          data={conflict.remoteData}
          timestamp={remoteTimestamp}
          isSelected={resolution === "remote"}
          onSelect={() => onResolutionChange(conflictId, "remote")}
        />
      </div>
    </div>
  );
};

export const ConflictResolutionModal: React.FC<ConflictResolutionProps> = ({
  conflicts,
  onResolve,
  onCancel,
  isOpen,
}) => {
  const [resolutions, setResolutions] = useState<
    Record<string, "local" | "remote">
  >({});

  if (!isOpen || conflicts.length === 0) {
    return null;
  }

  const handleResolve = () => {
    if (Object.keys(resolutions).length === conflicts.length) {
      onResolve(resolutions);
    }
  };

  const handleResolutionChange = (
    conflictId: string,
    resolution: "local" | "remote",
  ) => {
    setResolutions((prev) => ({
      ...prev,
      [conflictId]: resolution,
    }));
  };

  const resolvedCount = Object.keys(resolutions).length;
  const totalCount = conflicts.length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title="Data Sync Conflicts Detected"
      size="xl"
      showCloseButton={false}
      closeOnBackdropClick={false}
      closeOnEscape={false}
      className="border border-purple-700"
      footer={
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-400">
            {resolvedCount} of {totalCount} conflicts resolved
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleResolve}
              disabled={resolvedCount !== totalCount}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              Resolve Conflicts
            </button>
          </div>
        </div>
      }
    >
      <div>
        <p className="text-gray-400 mb-6">
          Your data was modified on multiple devices. Please choose which
          version to keep for each conflict:
        </p>

        <div className="space-y-6">
          {conflicts.map((conflict, index) => (
            <ConflictItem
              key={`${conflict.collection}-${conflict.documentId}-${index}`}
              conflict={conflict}
              index={index}
              resolution={
                resolutions[
                  `${conflict.collection}-${conflict.documentId}-${index}`
                ]
              }
              onResolutionChange={handleResolutionChange}
            />
          ))}
        </div>
      </div>
    </Modal>
  );
};
