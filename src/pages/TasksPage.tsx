import React from "react";
import { motion } from "framer-motion";
import { useAuthState } from "../contexts";
import { useTasks } from "../hooks/api/useTasks";
import { useSubmitTaskForReview } from "../hooks/api/useTaskQuery";
import { useTaskFilters } from "../hooks/useTaskFilters";
import type { Task } from "../types";
import {
  TaskItem,
  TaskSkeleton,
  TaskErrorBoundary,
  TaskError,
  TaskSearch,
} from "../components/tasks";
import { TaskStatsCard } from "../components/stats/TaskStatsCard";
import { FeatureErrorBoundary } from "../components/errors";
import { Card, Tooltip, Button } from "@/components/ui";
import {
  staggerContainerVariants,
  tabContentVariants,
  fadeInVariants,
  pulseVariants,
  getAccessibleVariants,
} from "../utils/animations";
import { logger } from "../utils/logging";

const ErrorState: React.FC<{ error?: Error; onRetry?: () => void }> = ({
  error,
  onRetry,
}) => (
  <TaskError
    error={error}
    title="Failed to Load Tasks"
    message="We couldn't load your tasks. Please check your connection and try again."
    onRetry={onRetry}
  />
);

// Tab Navigation Component
const TabNavigation: React.FC<{
  activeTab: "active" | "archived";
  setActiveTab: (tab: "active" | "archived") => void;
  activeCount: number;
  archivedCount: number;
}> = ({ activeTab, setActiveTab, activeCount, archivedCount }) => (
  <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 mb-6 sm:mb-8 px-2 sm:px-0">
    <Tooltip content="View tasks that are currently pending or awaiting approval">
      <Button
        onClick={() => setActiveTab("active")}
        className={`glass-nav px-4 sm:px-6 py-3 font-medium transition-all duration-300 min-h-[44px] touch-manipulation text-sm sm:text-base ${
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
        className={`glass-nav px-4 sm:px-6 py-3 font-medium transition-all duration-300 min-h-[44px] touch-manipulation text-sm sm:text-base ${
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
      <motion.div
        variants={getAccessibleVariants(fadeInVariants)}
        initial="initial"
        animate="animate"
      >
        <Card variant="glass" className="text-center py-8 sm:py-12">
          <motion.div
            className="glass-float"
            variants={getAccessibleVariants(pulseVariants)}
            animate="animate"
          >
            <div className="text-4xl sm:text-6xl mb-4">📝</div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-200 mb-2 px-4">
              No Active Tasks
            </h3>
            <p className="text-sm sm:text-base text-gray-400 px-4">
              You're all caught up! New tasks will appear here when assigned.
            </p>
          </motion.div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="space-y-4 sm:space-y-6"
      variants={getAccessibleVariants(staggerContainerVariants)}
      initial="initial"
      animate="animate"
    >
      {tasks.map((task) => (
        <Card
          key={task.id}
          variant="glass"
          className="glass-hover transform transition-all duration-300 sm:hover:scale-[1.02]"
        >
          <TaskItem task={task} userId={userId} onSubmit={handleSubmitTask} />
        </Card>
      ))}
    </motion.div>
  );
};

// Archived Tasks Section Component
const ArchivedTasksSection: React.FC<{ tasks: Task[] }> = ({ tasks }) => {
  if (tasks.length === 0) {
    return (
      <motion.div
        variants={getAccessibleVariants(fadeInVariants)}
        initial="initial"
        animate="animate"
      >
        <Card variant="glass" className="text-center py-8 sm:py-12">
          <motion.div
            className="glass-float"
            variants={getAccessibleVariants(pulseVariants)}
            animate="animate"
          >
            <div className="text-4xl sm:text-6xl mb-4">📚</div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-200 mb-2 px-4">
              No Archived Tasks
            </h3>
            <p className="text-sm sm:text-base text-gray-400 px-4">
              Completed and reviewed tasks will appear here.
            </p>
          </motion.div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="space-y-4 sm:space-y-6"
      variants={getAccessibleVariants(staggerContainerVariants)}
      initial="initial"
      animate="animate"
    >
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
    </motion.div>
  );
};

const TasksPage: React.FC = () => {
  const { user } = useAuthState();

  // Use TanStack Query hooks for tasks
  const {
    data: tasks = [],
    isLoading: loading,
    error,
    refetch,
  } = useTasks(user?.uid || "");

  const submitTaskMutation = useSubmitTaskForReview();

  // Task filtering, pagination, and categorization
  const {
    activeTab,
    activeTasks,
    archivedTasks,
    filteredTasks,
    paginatedTasks,
    searchQuery,
    currentPage,
    totalPages,
    setActiveTab: handleTabChange,
    setSearchQuery: handleSearchChange,
    setCurrentPage,
  } = useTaskFilters({ tasks, itemsPerPage: 20 });

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
    } catch (error) {
      const err =
        error instanceof Error ? error : new Error("Task submission failed");
      logger.error("Task submission error", {
        taskId,
        userId: user.uid,
        error: err.message,
      });
      throw err; // Re-throw to be caught by TaskItem error handling
    }
  };

  return (
    <TaskErrorBoundary>
      <div className="p-3 sm:p-4 md:p-6">
        {/* Enhanced Header with Glass Effect */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent mb-2">
            Task Management
          </h1>
          <div className="w-12 sm:w-16 h-1 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto rounded-full"></div>
        </div>

        {/* Task Stats Card */}
        {user && (
          <div className="max-w-4xl mx-auto mb-6 sm:mb-8">
            <TaskStatsCard userId={user.uid} />
          </div>
        )}

        <TabNavigation
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          activeCount={activeTasks.length}
          archivedCount={archivedTasks.length}
        />

        {/* Search Bar */}
        <div className="max-w-4xl mx-auto mb-6">
          <TaskSearch
            onSearchChange={handleSearchChange}
            placeholder={`Search ${activeTab} tasks...`}
          />
          {searchQuery && (
            <div className="text-sm text-gray-400 mt-2">
              Found {filteredTasks.length} task(s) matching &quot;{searchQuery}
              &quot;
            </div>
          )}
        </div>

        {/* Content with Glass Container */}
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <TaskSkeleton count={3} showSubmission={activeTab === "active"} />
          ) : error ? (
            <ErrorState error={error as Error} onRetry={() => refetch()} />
          ) : (
            <FeatureErrorBoundary feature="tasks-management">
              <motion.div
                key={activeTab}
                variants={getAccessibleVariants(tabContentVariants)}
                initial="initial"
                animate="animate"
              >
                {activeTab === "active" ? (
                  <ActiveTasksSection
                    tasks={paginatedTasks}
                    userId={user?.uid || ""}
                    handleSubmitTask={handleSubmitTask}
                  />
                ) : (
                  <ArchivedTasksSection tasks={paginatedTasks} />
                )}
              </motion.div>
            </FeatureErrorBoundary>
          )}

          {/* Pagination Controls */}
          {!loading && !error && totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <Button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="glass-nav px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </Button>
              <span className="text-gray-300">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="glass-nav px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </TaskErrorBoundary>
  );
};

export default TasksPage;
