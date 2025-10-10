/**
 * Conflict Resolution Modal
 * User interface for resolving data sync conflicts
 */
import React, { useState } from "react";
import type { ConflictInfo } from "@/types/database";
import { RadioGroup, RadioOption, Modal, Button } from "@/components/ui";

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
            <Button
              onClick={onCancel}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </Button>
            <Button
              onClick={handleResolve}
              disabled={resolvedCount !== totalCount}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              Resolve Conflicts
            </Button>
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
