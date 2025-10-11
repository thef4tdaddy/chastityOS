import React, { useState } from "react";
import { useAuthState } from "../contexts";
import { useTasks } from "../hooks/api/useTasks";
import { useSubmitTaskForReview } from "../hooks/api/useTaskQuery";
import type { Task } from "../types";
import { TaskItem, TaskSkeleton } from "../components/tasks";
import { TaskStatsCard } from "../components/stats/TaskStatsCard";
import { FeatureErrorBoundary } from "../components/errors";
import { Card, Tooltip, Button } from "@/components/ui";

const ErrorState: React.FC = () => (
  <div className="text-center py-8">
    <div className="text-red-400">Error loading tasks. Please try again.</div>
  </div>
);

// Tab Navigation Component
const TabNavigation: React.FC<{
  activeTab: "active" | "archived";
  setActiveTab: (tab: "active" | "archived") => void;
  activeCount: number;
  archivedCount: number;
}> = ({ activeTab, setActiveTab, activeCount, archivedCount }) => (
  <div className="flex justify-center space-x-4 mb-8">
    <Tooltip content="View tasks that are currently pending or awaiting approval">
      <Button
        onClick={() => setActiveTab("active")}
        className={`glass-nav px-6 py-3 font-medium transition-all duration-300 ${
          activeTab === "active"
            ? "primary-stat-card text-blue-200 shadow-liquid transform scale-105"
            : "text-gray-300 hover:text-white glass-hover"
        }`}
      >
        Active Tasks ({activeCount})
      </Button>
    </Tooltip>
    <Tooltip content="View completed, approved, or rejected tasks">
      <Button
        onClick={() => setActiveTab("archived")}
        className={`glass-nav px-6 py-3 font-medium transition-all duration-300 ${
          activeTab === "archived"
            ? "primary-stat-card text-blue-200 shadow-liquid transform scale-105"
            : "text-gray-300 hover:text-white glass-hover"
        }`}
      >
        Archived ({archivedCount})
      </Button>
    </Tooltip>
  </div>
);

// Active Tasks Section Component
const ActiveTasksSection: React.FC<{
  tasks: Task[];
  userId: string;
  handleSubmitTask: (
    taskId: string,
    note: string,
    attachments?: string[],
  ) => void;
}> = ({ tasks, userId, handleSubmitTask }) => {
  if (tasks.length === 0) {
    return (
      <Card variant="glass" className="text-center py-12">
        <div className="glass-float">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-gray-200 mb-2">
            No Active Tasks
          </h3>
          <p className="text-gray-400">
            You're all caught up! New tasks will appear here when assigned.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {tasks.map((task) => (
        <Card
          key={task.id}
          variant="glass"
          className="glass-hover transform transition-all duration-300 hover:scale-[1.02]"
        >
          <TaskItem task={task} userId={userId} onSubmit={handleSubmitTask} />
        </Card>
      ))}
    </div>
  );
};

// Archived Tasks Section Component
const ArchivedTasksSection: React.FC<{ tasks: Task[] }> = ({ tasks }) => {
  if (tasks.length === 0) {
    return (
      <Card variant="glass" className="text-center py-12">
        <div className="glass-float">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold text-gray-200 mb-2">
            No Archived Tasks
          </h3>
          <p className="text-gray-400">
            Completed and reviewed tasks will appear here.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {tasks.map((task) => (
        <Card
          key={task.id}
          variant="glass"
          className="opacity-75 hover:opacity-100 transition-opacity duration-300"
        >
          <TaskItem
            task={task}
            onSubmit={() => {}} // Archived tasks can't be submitted
          />
        </Card>
      ))}
    </div>
  );
};

const TasksPage: React.FC = () => {
  const { user } = useAuthState();
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // Use TanStack Query hooks for tasks
  const {
    data: tasks = [],
    isLoading: loading,
    error,
  } = useTasks(user?.uid || "");

  const submitTaskMutation = useSubmitTaskForReview();

  const handleSubmitTask = async (
    taskId: string,
    note: string,
    attachments?: string[],
  ) => {
    if (!user) return;

    try {
      await submitTaskMutation.mutateAsync({
        taskId,
        userId: user.uid,
        note,
        attachments,
      });
    } catch {
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

  // Calculate pagination
  const currentTasks = activeTab === "active" ? activeTasks : archivedTasks;
  const totalPages = Math.ceil(currentTasks.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedTasks = currentTasks.slice(startIndex, endIndex);

  // Reset to page 1 when switching tabs
  const handleTabChange = (tab: "active" | "archived") => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  return (
    <div className="p-6">
      {/* Enhanced Header with Glass Effect */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent mb-2">
          Task Management
        </h1>
        <div className="w-16 h-1 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto rounded-full"></div>
      </div>

      {/* Task Stats Card */}
      {user && (
        <div className="max-w-4xl mx-auto mb-8">
          <TaskStatsCard userId={user.uid} />
        </div>
      )}

      <TabNavigation
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        activeCount={activeTasks.length}
        archivedCount={archivedTasks.length}
      />

      {/* Content with Glass Container */}
      <div className="max-w-4xl mx-auto">
        {loading ? (
          <TaskSkeleton count={3} showSubmission={activeTab === "active"} />
        ) : error ? (
          <ErrorState />
        ) : (
          <FeatureErrorBoundary feature="tasks-management">
            {activeTab === "active" ? (
              <ActiveTasksSection
                tasks={paginatedTasks}
                userId={user?.uid || ""}
                handleSubmitTask={handleSubmitTask}
              />
            ) : (
              <ArchivedTasksSection tasks={paginatedTasks} />
            )}
          </FeatureErrorBoundary>
        )}

        {/* Pagination Controls */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <Button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="glass-nav px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </Button>
            <span className="text-gray-300">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="glass-nav px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TasksPage;
