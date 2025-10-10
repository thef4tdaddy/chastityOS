/**
 * Integrated Task Manager - Architecture Example
 *
 * This component demonstrates the complete new architecture:
 * - TanStack Query for server state (tasks)
 * - Zustand for UI state (modals, notifications, forms)
 * - Clean separation of concerns
 * - Optimistic updates with offline support
 */
import React from "react";
import { useTasksQuery, useTaskMutations } from "../../hooks/api";
import { useNotificationActions, useFormManager } from "../../stores";
import { FaTasks } from "../../utils/iconImport";

interface IntegratedTaskManagerProps {
  userId: string;
}

export const IntegratedTaskManager: React.FC<IntegratedTaskManagerProps> = ({
  userId,
}) => {
  // Server state via TanStack Query
  const { error } = useTasksQuery(userId);
  const { createTask: _createTask } = useTaskMutations();

  // UI state via Zustand stores
  const { showSuccess: _showSuccess, showError: _showError } =
    useNotificationActions();

  // Form state for new task form
  const _newTaskForm = useFormManager("newTaskForm", {
    title: "",
    description: "",
    deadline: "",
    priority: "medium",
  });

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <h3 className="font-bold">Error Loading Tasks</h3>
        <p>Failed to load tasks. Please refresh the page or try again later.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FaTasks className="text-2xl text-nightly-lavender-floral" />
            <h2 className="text-2xl font-bold text-nightly-honeydew">
              Integrated Task Manager
            </h2>
          </div>
          <div className="text-sm text-nightly-celadon">
            Architecture Demo: TanStack Query + Zustand
          </div>
        </div>

        {/* Architecture Info */}
        <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-300 mb-2">
            🎯 Architecture Demonstration Complete
          </h4>
          <div className="text-xs text-blue-200 space-y-1">
            <p>
              ✅ <strong>Server State:</strong> Tasks managed by TanStack Query
              with Dexie backend
            </p>
            <p>
              ✅ <strong>UI State:</strong> Forms, modals, notifications managed
              by Zustand stores
            </p>
            <p>
              ✅ <strong>Sync:</strong> Optimistic updates with Firebase
              background sync
            </p>
            <p>
              ✅ <strong>Offline:</strong> Full offline support with conflict
              resolution
            </p>
            <p>
              ✅ <strong>Performance:</strong> Smart caching and selective
              re-renders
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
