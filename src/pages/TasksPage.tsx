import React, { useState, useEffect } from "react";
import { useAuthState } from "../contexts";
import { taskDBService } from "../services/database";
import type { DBTask, TaskStatus } from "../types/database";
import { TaskItem } from "../components/tasks";
import { logger } from "../utils/logging";

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
    <div className="p-6">
      {/* Enhanced Header with Glass Effect */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent mb-2">
          Task Management
        </h1>
        <div className="w-16 h-1 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto rounded-full"></div>
      </div>

      {/* Tab Navigation with Glass Pills */}
      <div className="flex justify-center space-x-4 mb-8">
        <button
          onClick={() => setActiveTab("active")}
          className={`glass-nav px-6 py-3 font-medium transition-all duration-300 ${
            activeTab === "active"
              ? "glass-card-primary text-blue-200 shadow-liquid transform scale-105"
              : "text-gray-300 hover:text-white glass-hover"
          }`}
        >
          Active Tasks ({activeTasks.length})
        </button>
        <button
          onClick={() => setActiveTab("archived")}
          className={`glass-nav px-6 py-3 font-medium transition-all duration-300 ${
            activeTab === "archived"
              ? "glass-card-primary text-blue-200 shadow-liquid transform scale-105"
              : "text-gray-300 hover:text-white glass-hover"
          }`}
        >
          Archived ({archivedTasks.length})
        </button>
      </div>

      {/* Content with Glass Container */}
      <div className="max-w-4xl mx-auto">
        {loading ? (
          <div className="glass-card text-center py-12">
            <div className="glass-float">
              <div className="inline-flex items-center space-x-2">
                <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-blue-200 text-lg">Loading tasks...</span>
              </div>
            </div>
          </div>
        ) : (
          <>
            {activeTab === "active" ? (
              activeTasks.length > 0 ? (
                <div className="space-y-6">
                  {activeTasks.map((task) => (
                    <div
                      key={task.id}
                      className="glass-card glass-hover transform transition-all duration-300 hover:scale-[1.02]"
                    >
                      <TaskItem task={task} onSubmit={handleSubmitTask} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-card text-center py-12">
                  <div className="glass-float">
                    <div className="text-6xl mb-4">📝</div>
                    <h3 className="text-xl font-semibold text-gray-200 mb-2">
                      No Active Tasks
                    </h3>
                    <p className="text-gray-400">
                      You're all caught up! New tasks will appear here when
                      assigned.
                    </p>
                  </div>
                </div>
              )
            ) : archivedTasks.length > 0 ? (
              <div className="space-y-6">
                {archivedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="glass-card opacity-75 hover:opacity-100 transition-opacity duration-300"
                  >
                    <TaskItem
                      task={task}
                      onSubmit={() => {}} // Archived tasks can't be submitted
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card text-center py-12">
                <div className="glass-float">
                  <div className="text-6xl mb-4">📚</div>
                  <h3 className="text-xl font-semibold text-gray-200 mb-2">
                    No Archived Tasks
                  </h3>
                  <p className="text-gray-400">
                    Completed and reviewed tasks will appear here.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TasksPage;
