import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuthState } from "../contexts";
import { taskDBService } from "../services/database";
import type { DBTask, TaskStatus } from "../types/database";
import { TaskItem } from "../components/tasks";
import { logger } from "../utils/logging";
import { FaArrowLeft } from "react-icons/fa";

const TasksPage: React.FC = () => {
  const { user } = useAuthState();
  const [tasks, setTasks] = useState<DBTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");

  useEffect(() => {
    const fetchTasks = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const userTasks = await taskDBService.findByUserId(user.uid);
        setTasks(userTasks);
      } catch (error) {
        logger.error("Error fetching tasks:", error, "TasksPage");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [user]);

  const handleSubmitTask = async (taskId: string, note: string) => {
    try {
      await taskDBService.updateTaskStatus(taskId, "submitted", note);

      // Update local state
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? {
                ...task,
                status: "submitted" as TaskStatus,
                submittedAt: new Date(),
                submissiveNote: note,
              }
            : task,
        ),
      );
    } catch (error) {
      logger.error("Error submitting task:", error, "TasksPage");
    }
  };

  const activeTasks = tasks.filter((task) =>
    ["pending", "submitted"].includes(task.status),
  );

  const archivedTasks = tasks.filter((task) =>
    ["approved", "rejected", "completed", "cancelled"].includes(task.status),
  );

  return (
    <div className="bg-gradient-to-br from-nightly-mobile-bg to-nightly-desktop-bg min-h-screen text-nightly-spring-green">
      {/* Header */}
      <header className="p-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard"
            className="text-nightly-aquamarine hover:text-nightly-spring-green"
          >
            <FaArrowLeft />
          </Link>
          <h1 className="text-2xl font-bold">Tasks</h1>
        </div>
      </header>

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
