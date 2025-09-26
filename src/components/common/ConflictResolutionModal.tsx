/**
 * Conflict Resolution Modal
 * User interface for resolving data sync conflicts
 */
import React, { useState } from "react";
import type { ConflictInfo } from "@/types/database";

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

  const getDeviceLabel = (isLocal: boolean): string => {
    return isLocal ? "This Device" : "Other Device";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 border border-purple-700 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-purple-700">
          <h2 className="text-xl font-semibold text-purple-300">
            Data Sync Conflicts Detected
          </h2>
          <p className="text-gray-400 mt-2">
            Your data was modified on multiple devices. Please choose which
            version to keep for each conflict:
          </p>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-6">
            {conflicts.map((conflict, index) => {
              const conflictId = `${conflict.collection}-${conflict.documentId}-${index}`;
              const localTimestamp = new Date(
                conflict.localData.lastModified as string,
              );
              const remoteTimestamp = new Date(
                conflict.remoteData.lastModified as string,
              );

              return (
                <div
                  key={conflictId}
                  className="border border-gray-700 rounded-lg p-4"
                >
                  <h3 className="text-lg font-medium text-purple-200 mb-3">
                    {conflict.collection.charAt(0).toUpperCase() +
                      conflict.collection.slice(1)}{" "}
                    Conflict
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Local Version */}
                    <label className="cursor-pointer">
                      <input
                        type="radio"
                        name={conflictId}
                        value="local"
                        checked={resolutions[conflictId] === "local"}
                        onChange={() =>
                          handleResolutionChange(conflictId, "local")
                        }
                        className="sr-only"
                      />
                      <div
                        className={`border-2 rounded-lg p-4 transition-colors ${
                          resolutions[conflictId] === "local"
                            ? "border-purple-500 bg-purple-500/10"
                            : "border-gray-600 hover:border-purple-400"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-purple-300">
                            {getDeviceLabel(true)}
                          </span>
                          <span className="text-sm text-gray-400">
                            {formatTimestamp(localTimestamp)}
                          </span>
                        </div>

                        <div className="bg-gray-900 rounded p-3 text-sm">
                          <pre className="whitespace-pre-wrap text-gray-300 overflow-x-auto">
                            {formatValue(conflict.localData)}
                          </pre>
                        </div>
                      </div>
                    </label>

                    {/* Remote Version */}
                    <label className="cursor-pointer">
                      <input
                        type="radio"
                        name={conflictId}
                        value="remote"
                        checked={resolutions[conflictId] === "remote"}
                        onChange={() =>
                          handleResolutionChange(conflictId, "remote")
                        }
                        className="sr-only"
                      />
                      <div
                        className={`border-2 rounded-lg p-4 transition-colors ${
                          resolutions[conflictId] === "remote"
                            ? "border-purple-500 bg-purple-500/10"
                            : "border-gray-600 hover:border-purple-400"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-purple-300">
                            {getDeviceLabel(false)}
                          </span>
                          <span className="text-sm text-gray-400">
                            {formatTimestamp(remoteTimestamp)}
                          </span>
                        </div>

                        <div className="bg-gray-900 rounded p-3 text-sm">
                          <pre className="whitespace-pre-wrap text-gray-300 overflow-x-auto">
                            {formatValue(conflict.remoteData)}
                          </pre>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-6 border-t border-purple-700 flex justify-between items-center">
          <div className="text-sm text-gray-400">
            {Object.keys(resolutions).length} of {conflicts.length} conflicts
            resolved
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
              disabled={Object.keys(resolutions).length !== conflicts.length}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              Resolve Conflicts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
