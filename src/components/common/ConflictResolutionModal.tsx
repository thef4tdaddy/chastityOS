/**
 * Conflict Resolution Modal
 * User interface for resolving data sync conflicts
 */
import React, { useState } from "react";
import type { ConflictInfo } from "@/types/database";
import { RadioGroup, RadioOption } from "@/components/ui";

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

// Removed VersionOption component - now using RadioGroup from UI library

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

  const versionOptions: RadioOption[] = [
    {
      value: "local",
      label: `${getDeviceLabel(true)} - ${formatTimestamp(localTimestamp)}`,
      description: formatValue(conflict.localData),
    },
    {
      value: "remote",
      label: `${getDeviceLabel(false)} - ${formatTimestamp(remoteTimestamp)}`,
      description: formatValue(conflict.remoteData),
    },
  ];

  return (
    <div className="border border-gray-700 rounded-lg p-4">
      <h3 className="text-lg font-medium text-purple-200 mb-3">
        {conflict.collection.charAt(0).toUpperCase() +
          conflict.collection.slice(1)}{" "}
        Conflict
      </h3>

      <RadioGroup
        name={conflictId}
        value={resolution || ""}
        onChange={(value) =>
          onResolutionChange(conflictId, value as "local" | "remote")
        }
        options={versionOptions}
        orientation="horizontal"
        size="md"
        className="[&_label]:border-2 [&_label]:rounded-lg [&_label]:p-4"
      />
    </div>
  );
};

// Modal Header Component
const ModalHeader: React.FC = () => (
  <div className="p-6 border-b border-purple-700">
    <h2 className="text-xl font-semibold text-purple-300">
      Data Sync Conflicts Detected
    </h2>
    <p className="text-gray-400 mt-2">
      Your data was modified on multiple devices. Please choose which version to
      keep for each conflict:
    </p>
  </div>
);

// Modal Footer Component
interface ModalFooterProps {
  resolvedCount: number;
  totalCount: number;
  onCancel: () => void;
  onResolve: () => void;
}

const ModalFooter: React.FC<ModalFooterProps> = ({
  resolvedCount,
  totalCount,
  onCancel,
  onResolve,
}) => (
  <div className="p-6 border-t border-purple-700 flex justify-between items-center">
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
        onClick={onResolve}
        disabled={resolvedCount !== totalCount}
        className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
      >
        Resolve Conflicts
      </button>
    </div>
  </div>
);

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 border border-purple-700 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <ModalHeader />

        <div className="p-6 overflow-y-auto max-h-[60vh]">
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

        <ModalFooter
          resolvedCount={Object.keys(resolutions).length}
          totalCount={conflicts.length}
          onCancel={onCancel}
          onResolve={handleResolve}
        />
      </div>
    </div>
  );
};
