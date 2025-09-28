import React, { useState } from "react";
import type { TaskStatus } from "../../types/database";
import { useTasksQuery, useTaskMutations } from "../../hooks/api";
import { useNotificationActions } from "../../stores";
import {
  FaTasks,
  FaPlus,
  FaCheckCircle,
  FaTimesCircle,
} from "../../utils/iconImport";

// Task Management for Keyholder
interface TaskManagementProps {
  userId: string; // Changed to accept userId instead of tasks array
}

export const TaskManagement: React.FC<TaskManagementProps> = ({ userId }) => {
  const [newTaskText, setNewTaskText] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);

  // Use TanStack Query hooks instead of direct service calls
  const { data: tasks = [], isLoading, error } = useTasksQuery(userId);
  const { updateTaskStatus, createTask } = useTaskMutations();
  const { showSuccess, showError } = useNotificationActions();

  const pendingTasks = tasks.filter((t) =>
    ["pending", "submitted"].includes(t.status),
  );

  const handleTaskAction = async (
    taskId: string,
    action: "approve" | "reject",
    feedback?: string,
  ) => {
    try {
      const newStatus: TaskStatus =
        action === "approve" ? "approved" : "rejected";

      await updateTaskStatus.mutateAsync({
        taskId,
        userId,
        status: newStatus,
        feedback,
      });

      showSuccess(
        `Task ${action === "approve" ? "approved" : "rejected"} successfully`,
        "Task Updated",
      );
    } catch {
      showError(
        `Failed to ${action} task. Please try again.`,
        "Task Update Failed",
      );
    }
  };

  const handleAddTask = async () => {
    if (!newTaskText.trim()) return;

    try {
      await createTask.mutateAsync({
        userId,
        title: newTaskText.trim(),
        description: "",
      });

      setNewTaskText("");
      setShowAddTask(false);
      showSuccess("Task created successfully", "Task Added");
    } catch {
      showError(
        "Failed to create task. Please try again.",
        "Task Creation Failed",
      );
    }
  };

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        Failed to load tasks. Please refresh the page.
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <FaTasks className="text-nightly-lavender-floral" />
          <h3 className="text-lg font-semibold text-nightly-honeydew">
            Task Management
          </h3>
        </div>
        <button
          onClick={() => setShowAddTask(!showAddTask)}
          className="bg-nightly-lavender-floral hover:bg-nightly-lavender-floral/80 text-white px-3 py-1 rounded text-sm flex items-center gap-2"
        >
          <FaPlus />
          Add Task
        </button>
      </div>

      {showAddTask && (
        <div className="mb-6 bg-white/5 rounded-lg p-4">
          <h4 className="font-medium text-nightly-honeydew mb-3">
            Create New Task
          </h4>
          <div className="space-y-3">
            <textarea
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="Task description..."
              className="w-full bg-white/5 border border-white/10 rounded p-3 text-nightly-honeydew placeholder-nightly-celadon/50 resize-none"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddTask}
                disabled={!newTaskText.trim() || createTask.isPending}
                className="bg-nightly-aquamarine hover:bg-nightly-aquamarine/80 disabled:opacity-50 text-black px-4 py-2 rounded font-medium transition-colors"
              >
                {createTask.isPending ? "Creating..." : "Create Task"}
              </button>
              <button
                onClick={() => setShowAddTask(false)}
                className="bg-white/10 hover:bg-white/20 text-nightly-celadon px-4 py-2 rounded font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="text-center text-nightly-celadon py-4">
          Loading tasks...
        </div>
      )}

      {/* Tasks list */}
      <div className="space-y-3">
        {!isLoading && pendingTasks.length === 0 ? (
          <p className="text-nightly-celadon">No pending tasks</p>
        ) : (
          pendingTasks.map((task) => (
            <div key={task.id} className="bg-white/5 rounded-lg p-4">
              <div className="mb-3">
                <h4 className="font-medium text-nightly-honeydew mb-1">
                  {task.title}
                </h4>
                <div className="flex items-center gap-2 text-sm text-nightly-celadon">
                  <span>Status: {task.status}</span>
                  {task.priority && (
                    <>
                      <span>•</span>
                      <span>Priority: {task.priority}</span>
                    </>
                  )}
                  {task.deadline && (
                    <>
                      <span>•</span>
                      <span>Due: {task.deadline.toLocaleDateString()}</span>
                    </>
                  )}
                </div>
                {task.description && (
                  <p className="text-sm text-nightly-celadon mt-1">
                    {task.description}
                  </p>
                )}
              </div>

              {task.submissiveNote && (
                <div className="bg-white/5 rounded p-2 mb-3">
                  <div className="text-xs text-nightly-celadon mb-1">
                    Submissive Note:
                  </div>
                  <div className="text-sm text-nightly-honeydew">
                    {task.submissiveNote}
                  </div>
                </div>
              )}

              {task.status === "submitted" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleTaskAction(task.id, "approve")}
                    disabled={updateTaskStatus.isPending}
                    className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                  >
                    <FaCheckCircle />
                    {updateTaskStatus.isPending ? "Processing..." : "Approve"}
                  </button>
                  <button
                    onClick={() => handleTaskAction(task.id, "reject")}
                    disabled={updateTaskStatus.isPending}
                    className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                  >
                    <FaTimesCircle />
                    {updateTaskStatus.isPending ? "Processing..." : "Reject"}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
