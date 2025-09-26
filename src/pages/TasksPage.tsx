import React, { useState } from "react";
import { useAuthState } from "../contexts";
import { useTasks, useUpdateTaskStatus } from "../hooks/api/useTasks";
import type { DBTask, TaskStatus } from "../types/database";
import { TaskItem } from "../components/tasks";

const TasksPage: React.FC = () => {
  const { user } = useAuthState();
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");

  // Use TanStack Query hooks for tasks
  const {
    data: tasks = [],
    isLoading: loading,
    error,
  } = useTasks(user?.uid || "");

  const updateTaskStatus = useUpdateTaskStatus();

  const handleSubmitTask = async (taskId: string, note: string) => {
    if (!user) return;

    try {
      await updateTaskStatus.mutateAsync({
        taskId,
        userId: user.uid,
        status: "submitted" as TaskStatus,
        // Note: submissiveNote would be handled in task updates
      });
    } catch (error) {
      // Error is already logged in the hook
      // TODO: Add toast notification for user feedback on error
    }
  };

  const activeTasks = tasks.filter((task) =>
    ["pending", "submitted"].includes(task.status),
  );

  const archivedTasks = tasks.filter((task) =>
    ["approved", "rejected", "completed", "cancelled"].includes(task.status),
  );

  return (
    <div className="text-nightly-spring-green">
      {/* Tab Navigation */}
      <div className="p-4">
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab("active")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "active"
                ? "bg-nightly-aquamarine text-black"
                : "bg-white/10 text-nightly-celadon hover:bg-white/20"
            }`}
          >
            Active Tasks ({activeTasks.length})
          </button>
          <button
            onClick={() => setActiveTab("archived")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "archived"
                ? "bg-nightly-aquamarine text-black"
                : "bg-white/10 text-nightly-celadon hover:bg-white/20"
            }`}
          >
            Archived ({archivedTasks.length})
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-8">
            <div className="text-nightly-celadon">Loading tasks...</div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-red-400">
              Error loading tasks. Please try again.
            </div>
          </div>
        ) : (
          <div className="max-w-4xl">
            {activeTab === "active" ? (
              activeTasks.length > 0 ? (
                <div className="space-y-4">
                  {activeTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onSubmit={handleSubmitTask}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-nightly-celadon">No active tasks</div>
                </div>
              )
            ) : archivedTasks.length > 0 ? (
              <div className="space-y-4">
                {archivedTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onSubmit={() => {}} // Archived tasks can't be submitted
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-nightly-celadon">No archived tasks</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TasksPage;
