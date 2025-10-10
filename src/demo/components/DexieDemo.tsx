/**
 * Dexie Demo Component
 * Demonstrates offline-first functionality with Dexie
 */
import React, { useState, useEffect } from "react";
import { useDexieSync } from "../hooks/useDexieSync";
import { useOfflineDemo } from "../hooks/useOfflineDemo";
import { useAuth } from "@/contexts/AuthContext";
import type { DBTask } from "@/types/database";
import type { User } from "@/types";
import { Button, Checkbox, Input } from "@/components/ui";

// Status Indicators Component
interface StatusIndicatorsProps {
  isOnline: boolean;
  syncStatus: string | null;
  onManualSync: () => Promise<void>;
  onSimulateOffline: () => void;
  onSimulateOnline: () => void;
}

const StatusIndicators: React.FC<StatusIndicatorsProps> = ({
  isOnline,
  syncStatus,
  onManualSync,
  onSimulateOffline,
  onSimulateOnline,
}) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center space-x-4 text-sm">
      <span
        className={`px-2 py-1 rounded ${isOnline ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"}`}
      >
        {isOnline ? "🌐 Online" : "📱 Offline"}
      </span>
      <span
        className={`px-2 py-1 rounded ${
          syncStatus === "synced"
            ? "bg-green-900 text-green-300"
            : syncStatus === "pending"
              ? "bg-yellow-900 text-yellow-300"
              : "bg-gray-700 text-gray-300"
        }`}
      >
        Sync: {syncStatus || "unknown"}
      </span>
    </div>

    <div className="flex items-center space-x-2">
      <Button
        onClick={onManualSync}
        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
      >
        🔄 Sync Now
      </Button>
      <Button
        onClick={isOnline ? onSimulateOffline : onSimulateOnline}
        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors"
      >
        {isOnline ? "📱 Go Offline" : "🌐 Go Online"}
      </Button>
    </div>
  </div>
);

// Task Input Component
interface TaskInputProps {
  newTaskText: string;
  onTextChange: (text: string) => void;
  onAddTask: () => Promise<void>;
  loading: boolean;
}

const TaskInput: React.FC<TaskInputProps> = ({
  newTaskText,
  onTextChange,
  onAddTask,
  loading,
}) => (
  <div className="flex space-x-2 mb-4">
    <Input
      type="text"
      value={newTaskText}
      onChange={(e) => onTextChange(e.target.value)}
      placeholder="Enter task description..."
      className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
      disabled={loading}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !loading) {
          onAddTask();
        }
      }}
    />
    <Button
      onClick={onAddTask}
      disabled={loading || !newTaskText.trim()}
      className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors"
    >
      {loading ? "Adding..." : "Add Task"}
    </Button>
  </div>
);

// Error Display Component
interface ErrorDisplayProps {
  error: string | null;
  onClearError: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onClearError }) => {
  if (!error) return null;

  return (
    <div className="mb-4 p-3 bg-red-900 text-red-300 rounded border border-red-700">
      <div className="flex items-center justify-between">
        <span>❌ {error}</span>
        <Button
          onClick={onClearError}
          className="text-red-300 hover:text-white"
        >
          ✕
        </Button>
      </div>
    </div>
  );
};

// Login Prompt Component
const LoginPrompt: React.FC = () => (
  <div className="p-6 bg-gray-800 rounded-lg border border-gray-700 text-center">
    <h2 className="text-xl font-bold mb-2 text-white">
      🔐 Authentication Required
    </h2>
    <p className="text-gray-400">
      Please log in to use the Dexie Demo functionality.
    </p>
  </div>
);

// Task List Component
interface TaskListProps {
  tasks: DBTask[];
  onUpdateTask: (taskId: string, updates: Partial<DBTask>) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  loading: boolean;
}

const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onUpdateTask,
  onDeleteTask,
  loading,
}) => (
  <div className="space-y-2">
    <h3 className="text-lg font-semibold text-white mb-3">
      Tasks ({tasks.length})
    </h3>
    {tasks.length === 0 ? (
      <p className="text-gray-400 text-center py-4">
        No tasks yet. Add your first task above!
      </p>
    ) : (
      tasks.map((task) => (
        <div
          key={task.id}
          className="flex items-center justify-between p-3 bg-gray-700 rounded border border-gray-600"
        >
          <div className="flex items-center space-x-3">
            <Checkbox
              checked={task.status === "completed"}
              onChange={() =>
                onUpdateTask(task.id, {
                  status: task.status === "completed" ? "pending" : "completed",
                })
              }
              disabled={loading}
              size="sm"
            />
            <span
              className={`flex-1 ${
                task.status === "completed"
                  ? "line-through text-gray-400"
                  : "text-white"
              }`}
            >
              {task.text}
            </span>
          </div>
          <Button
            onClick={() => onDeleteTask(task.id)}
            disabled={loading}
            className="text-red-400 hover:text-red-300 disabled:opacity-50"
          >
            🗑️
          </Button>
        </div>
      ))
    )}
  </div>
);

// Custom hook for task management
const useTaskManagement = (
  user: User | null,
  createWithSync: <T>(service: string, data: T) => Promise<string>,
  updateWithSync: <T>(service: string, id: string, updates: T) => Promise<void>,
  deleteWithSync: (service: string, id: string) => Promise<void>,
  findByUserId: (service: string, userId: string) => Promise<DBTask[]>,
) => {
  const [tasks, setTasks] = useState<DBTask[]>([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load tasks on mount
  useEffect(() => {
    const loadTasks = async () => {
      if (!user?.uid) return;

      try {
        setLoading(true);
        const userTasks = await findByUserId("tasks", user.uid);
        setTasks(userTasks as DBTask[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tasks");
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [user?.uid, findByUserId]);

  const handleAddTask = async () => {
    if (!user?.uid || !newTaskText.trim()) return;

    try {
      setError(null);
      const newTask: Omit<DBTask, "id"> = {
        userId: user.uid,
        syncStatus: "pending",
        lastModified: new Date(),
        text: newTaskText.trim(),
        description: newTaskText.trim(),
        status: "pending",
        priority: "medium",
        assignedBy: "submissive",
        createdAt: new Date(),
        category: "general",
        type: "manual",
      };

      const createdTaskId = await createWithSync("tasks", newTask);
      const fullTask: DBTask = { ...newTask, id: createdTaskId };
      setTasks((prev) => [...prev, fullTask]);
      setNewTaskText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<DBTask>) => {
    try {
      setError(null);
      await updateWithSync("tasks", taskId, {
        ...updates,
        updatedAt: new Date(),
      });

      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, ...updates } : task,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      setError(null);
      await deleteWithSync("tasks", taskId);
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task");
    }
  };

  return {
    tasks,
    newTaskText,
    setNewTaskText,
    loading,
    error,
    setError,
    handleAddTask,
    handleUpdateTask,
    handleDeleteTask,
  };
};

export const DexieDemo: React.FC = () => {
  const { user } = useAuth();
  const {
    createWithSync,
    updateWithSync,
    deleteWithSync,
    findByUserId,
    isOnline,
    syncStatus,
    triggerSync,
  } = useDexieSync();

  const { simulateOffline, simulateOnline } = useOfflineDemo();

  const {
    tasks,
    newTaskText,
    setNewTaskText,
    loading,
    error,
    setError,
    handleAddTask,
    handleUpdateTask,
    handleDeleteTask,
  } = useTaskManagement(
    user,
    createWithSync,
    updateWithSync,
    deleteWithSync,
    findByUserId,
  );

  const handleManualSync = async () => {
    try {
      setError(null);
      await triggerSync();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    }
  };

  if (!user) {
    return <LoginPrompt />;
  }

  return (
    <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
      <h2 className="text-xl font-bold mb-2 text-white">
        🗄️ Dexie Offline Demo
      </h2>
      <p className="text-sm text-gray-400 mb-4">
        Test offline functionality: Tasks are saved locally first, then synced
        to Firebase when online. Try creating tasks while "offline" to see them
        queue for sync!
      </p>

      <StatusIndicators
        isOnline={isOnline}
        syncStatus={syncStatus}
        onManualSync={handleManualSync}
        onSimulateOffline={simulateOffline}
        onSimulateOnline={simulateOnline}
      />

      <ErrorDisplay error={error} onClearError={() => setError(null)} />

      <TaskInput
        newTaskText={newTaskText}
        onTextChange={setNewTaskText}
        onAddTask={handleAddTask}
        loading={loading}
      />

      <TaskList
        tasks={tasks}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
        loading={loading}
      />
    </div>
  );
};
