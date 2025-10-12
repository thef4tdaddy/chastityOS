import React, { useState } from "react";
import type { DBTask } from "../../types/database";
import { useTasksQuery, useTaskMutations } from "../../hooks/api";
import { useNotificationActions } from "../../stores";
import {
  FaTasks,
  FaPlus,
  FaCheckCircle,
  FaTimesCircle,
} from "../../utils/iconImport";
import { Input, Textarea, Button } from "@/components/ui";
import { TaskError } from "../tasks/TaskError";
import { logger } from "../../utils/logging";
import { FeatureErrorBoundary } from "../errors/FeatureErrorBoundary";

// Task Management for Keyholder
interface TaskManagementProps {
  userId: string; // Changed to accept userId instead of tasks array
}

// Add Task Form Component
const AddTaskForm: React.FC<{
  showAddTask: boolean;
  setShowAddTask: (show: boolean) => void;
  newTaskText: string;
  setNewTaskText: (text: string) => void;
  pointValue: number;
  setPointValue: (value: number) => void;
  handleAddTask: () => void;
  isCreating: boolean;
}> = ({
  showAddTask,
  setShowAddTask,
  newTaskText,
  setNewTaskText,
  pointValue,
  setPointValue,
  handleAddTask,
  isCreating,
}) => {
  if (!showAddTask) return null;

  return (
    <div 
      id="add-task-form" 
      className="mb-6 bg-white/5 rounded-lg p-3 sm:p-4"
      role="form"
      aria-labelledby="add-task-heading"
    >
      <h4 id="add-task-heading" className="text-sm sm:text-base font-medium text-nightly-honeydew mb-3">
        Create New Task
      </h4>
      <div className="space-y-3">
        <div>
          <label htmlFor="task-description" className="sr-only">
            Task description
          </label>
          <Textarea
            id="task-description"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="Task description..."
            className="w-full bg-white/5 border border-white/10 rounded p-3 text-sm sm:text-base text-nightly-honeydew placeholder-nightly-celadon/50 resize-none"
            rows={3}
            aria-required="true"
          />
        </div>
        <div>
          <label htmlFor="task-points" className="block text-xs sm:text-sm text-nightly-celadon mb-1">
            Point Value (optional)
          </label>
          <Input
            id="task-points"
            type="number"
            min="0"
            max="100"
            value={pointValue}
            onChange={(e) =>
              setPointValue(Math.max(0, Math.min(100, Number(e.target.value))))
            }
            placeholder="10"
            className="w-full bg-white/5 border border-white/10 rounded p-3 sm:p-2 text-sm sm:text-base text-nightly-honeydew placeholder-nightly-celadon/50"
            aria-describedby="task-points-help"
          />
          <p id="task-points-help" className="text-xs text-nightly-celadon/70 mt-1">
            Points awarded when task is approved (0-100)
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={handleAddTask}
            disabled={!newTaskText.trim() || isCreating}
            aria-label={isCreating ? "Creating task" : "Create task"}
            className="bg-nightly-aquamarine hover:bg-nightly-aquamarine/80 disabled:opacity-50 disabled:cursor-not-allowed text-black px-4 py-3 sm:py-2 rounded font-medium transition-colors flex items-center justify-center gap-2 min-h-[44px] touch-manipulation"
          >
            {isCreating && (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" aria-hidden="true" />
            )}
            {isCreating ? "Creating..." : "Create Task"}
          </Button>
          <Button
            onClick={() => setShowAddTask(false)}
            aria-label="Cancel task creation"
            className="bg-white/10 hover:bg-white/20 text-nightly-celadon px-4 py-3 sm:py-2 rounded font-medium transition-colors min-h-[44px] touch-manipulation"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

// Task Item Component
const TaskItem: React.FC<{
  task: {
    id: string;
    title?: string;
    text: string;
    status: string;
    priority?: string;
    deadline?: Date;
    description?: string;
    submissiveNote?: string;
  };
  handleTaskAction: (
    taskId: string,
    action: "approve" | "reject",
    feedback?: string,
  ) => void;
  isUpdating: boolean;
}> = ({ task, handleTaskAction, isUpdating }) => (
  <article 
    key={task.id} 
    className="bg-white/5 rounded-lg p-3 sm:p-4"
    aria-label={`Task: ${task.title || task.text}`}
  >
    <div className="mb-3">
      <h4 className="text-sm sm:text-base font-medium text-nightly-honeydew mb-1 break-words">
        {task.title || task.text}
      </h4>
      <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs sm:text-sm text-nightly-celadon">
        <span><span className="sr-only">Task </span>Status: {task.status}</span>
        {task.priority && (
          <>
            <span className="hidden sm:inline" aria-hidden="true">•</span>
            <span>Priority: {task.priority}</span>
          </>
        )}
        {task.deadline && (
          <>
            <span className="hidden sm:inline" aria-hidden="true">•</span>
            <span>Due: <time dateTime={task.deadline.toISOString()}>{task.deadline.toLocaleDateString()}</time></span>
          </>
        )}
      </div>
      {task.description && (
        <p className="text-xs sm:text-sm text-nightly-celadon mt-1 break-words">
          {task.description}
        </p>
      )}
    </div>

    {task.submissiveNote && (
      <div className="bg-white/5 rounded p-2 mb-3">
        <div className="text-xs text-nightly-celadon mb-1">
          Submissive Note:
        </div>
        <div className="text-xs sm:text-sm text-nightly-honeydew break-words">
          {task.submissiveNote}
        </div>
      </div>
    )}

    {task.status === "submitted" && (
      <div className="flex flex-col sm:flex-row gap-2" role="group" aria-label="Task approval actions">
        <Button
          onClick={() => handleTaskAction(task.id, "approve")}
          disabled={isUpdating}
          aria-label={`Approve task: ${task.title || task.text}`}
          className="bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-3 sm:py-1 rounded text-sm flex items-center justify-center gap-1 transition-all min-h-[44px] sm:min-h-0 touch-manipulation"
        >
          {isUpdating ? (
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
          ) : (
            <FaCheckCircle aria-hidden="true" />
          )}
          <span>{isUpdating ? "Processing..." : "Approve"}</span>
        </Button>
        <Button
          onClick={() => handleTaskAction(task.id, "reject")}
          disabled={isUpdating}
          aria-label={`Reject task: ${task.title || task.text}`}
          className="bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-3 sm:py-1 rounded text-sm flex items-center justify-center gap-1 transition-all min-h-[44px] sm:min-h-0 touch-manipulation"
        >
          {isUpdating ? (
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
          ) : (
            <FaTimesCircle aria-hidden="true" />
          )}
          <span>{isUpdating ? "Processing..." : "Reject"}</span>
        </Button>
      </div>
    )}
  </article>
);

// Error Display Component
const ErrorDisplay: React.FC<{ error?: Error; onRetry?: () => void }> = ({
  error,
  onRetry,
}) => (
  <TaskError
    error={error}
    title="Failed to Load Tasks"
    message="Unable to load tasks. Please check your connection and try again."
    onRetry={onRetry}
  />
);

// Loading Display Component
const LoadingDisplay: React.FC = () => (
  <div className="text-center text-nightly-celadon py-4 flex items-center justify-center gap-2" role="status" aria-live="polite">
    <div className="w-4 h-4 border-2 border-nightly-celadon border-t-transparent rounded-full animate-spin" aria-hidden="true" />
    <span>Loading tasks...</span>
  </div>
);

// Task action handlers
const useTaskActions = (params: {
  userId: string;
  approveTask: ReturnType<typeof useTaskMutations>["approveTask"];
  rejectTask: ReturnType<typeof useTaskMutations>["rejectTask"];
  createTask: ReturnType<typeof useTaskMutations>["createTask"];
  showSuccess: (message: string, title: string) => void;
  showError: (message: string, title: string) => void;
  setNewTaskText: (text: string) => void;
  setShowAddTask: (show: boolean) => void;
}) => {
  const {
    userId,
    approveTask,
    rejectTask,
    createTask,
    showSuccess,
    showError,
    setNewTaskText,
    setShowAddTask,
  } = params;

  const handleTaskAction = async (
    taskId: string,
    action: "approve" | "reject",
    feedback?: string,
  ) => {
    try {
      if (action === "approve") {
        await approveTask.mutateAsync({
          taskId,
          userId,
          feedback,
        });
      } else {
        await rejectTask.mutateAsync({
          taskId,
          userId,
          feedback,
        });
      }

      showSuccess(
        `Task ${action === "approve" ? "approved" : "rejected"} successfully`,
        "Task Updated",
      );
    } catch (error) {
      const err =
        error instanceof Error ? error : new Error(`Failed to ${action} task`);
      logger.error(`Task ${action} failed`, {
        taskId,
        userId,
        error: err.message,
      });
      showError(
        `Failed to ${action} task. Please try again.`,
        "Task Update Failed",
      );
    }
  };

  const handleAddTask = async (newTaskText: string, pointValue: number) => {
    if (!newTaskText.trim()) return;

    try {
      await createTask.mutateAsync({
        userId,
        title: newTaskText.trim(),
        description: "",
        pointValue: pointValue > 0 ? pointValue : undefined,
      });

      setNewTaskText("");
      setShowAddTask(false);
      showSuccess("Task created successfully", "Task Added");
    } catch (error) {
      const err =
        error instanceof Error ? error : new Error("Failed to create task");
      logger.error("Task creation failed", {
        userId,
        title: newTaskText.trim(),
        error: err.message,
      });
      showError(
        "Failed to create task. Please try again.",
        "Task Creation Failed",
      );
    }
  };

  return { handleTaskAction, handleAddTask };
};

// Task List Component
const TaskList: React.FC<{
  isLoading: boolean;
  pendingTasks: DBTask[];
  handleTaskAction: (
    taskId: string,
    action: "approve" | "reject",
    feedback?: string,
  ) => void;
  isUpdating: boolean;
}> = ({ isLoading, pendingTasks, handleTaskAction, isUpdating }) => (
  <div className="space-y-3" role="list" aria-label="Pending tasks">
    {!isLoading && pendingTasks.length === 0 ? (
      <p className="text-nightly-celadon" role="status">No pending tasks</p>
    ) : (
      pendingTasks.map((task) => (
        <div key={task.id} role="listitem">
          <TaskItem
            task={task}
            handleTaskAction={handleTaskAction}
            isUpdating={isUpdating}
          />
        </div>
      ))
    )}
  </div>
);

export const TaskManagement: React.FC<TaskManagementProps> = ({ userId }) => {
  const [newTaskText, setNewTaskText] = useState("");
  const [pointValue, setPointValue] = useState(10);
  const [showAddTask, setShowAddTask] = useState(false);

  // Use TanStack Query hooks instead of direct service calls
  const { data: tasks = [], isLoading, error, refetch } = useTasksQuery(userId);
  const { approveTask, rejectTask, createTask } = useTaskMutations();
  const { showSuccess, showError } = useNotificationActions();

  const pendingTasks = tasks.filter((t) =>
    ["pending", "submitted"].includes(t.status),
  );

  const { handleTaskAction, handleAddTask } = useTaskActions({
    userId,
    approveTask,
    rejectTask,
    createTask,
    showSuccess,
    showError,
    setNewTaskText,
    setShowAddTask,
  });

  if (error) {
    return <ErrorDisplay error={error as Error} onRetry={() => refetch()} />;
  }

  return (
    <FeatureErrorBoundary 
      feature="task-management"
    >
      <section 
        className="bg-white/10 backdrop-blur-sm rounded-lg p-4 sm:p-6"
        role="region"
        aria-labelledby="task-management-heading"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3 sm:gap-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <FaTasks className="text-nightly-lavender-floral text-lg sm:text-base" aria-hidden="true" />
            <h3 id="task-management-heading" className="text-base sm:text-lg font-semibold text-nightly-honeydew">
              Task Management
            </h3>
          </div>
          <Button
            onClick={() => setShowAddTask(!showAddTask)}
            aria-expanded={showAddTask}
            aria-controls="add-task-form"
            aria-label={showAddTask ? "Close add task form" : "Open add task form"}
            className="bg-nightly-lavender-floral hover:bg-nightly-lavender-floral/80 text-white px-3 sm:px-3 py-3 sm:py-1 rounded text-sm flex items-center justify-center gap-2 min-h-[44px] sm:min-h-0 w-full sm:w-auto touch-manipulation"
          >
            <FaPlus aria-hidden="true" />
            <span>Add Task</span>
          </Button>
        </div>

        <AddTaskForm
          showAddTask={showAddTask}
          setShowAddTask={setShowAddTask}
          newTaskText={newTaskText}
          setNewTaskText={setNewTaskText}
          pointValue={pointValue}
          setPointValue={setPointValue}
          handleAddTask={() => handleAddTask(newTaskText, pointValue)}
          isCreating={createTask.isPending}
        />

        {isLoading && <LoadingDisplay />}

        <TaskList
          isLoading={isLoading}
          pendingTasks={pendingTasks}
          handleTaskAction={handleTaskAction}
          isUpdating={approveTask.isPending || rejectTask.isPending}
        />
      </section>
    </FeatureErrorBoundary>
  );
};
