/**
 * Dexie Demo Component
 * Demonstrates offline-first functionality with Dexie
 */
import React, { useState, useEffect } from "react";
import { useDexieSync } from "@/hooks/useDexieSync";
import { useOfflineDemo } from "@/hooks/useOfflineDemo";
import { useAuth } from "@/contexts/AuthContext";
import type { DBTask } from "@/types/database";

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
      <button
        onClick={onManualSync}
        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
      >
        🔄 Sync Now
      </button>
      <button
        onClick={isOnline ? onSimulateOffline : onSimulateOnline}
        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors"
      >
        {isOnline ? "📱 Go Offline" : "🌐 Go Online"}
      </button>
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
    <input
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
    <button
      onClick={onAddTask}
      disabled={loading || !newTaskText.trim()}
      className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors"
    >
      {loading ? "Adding..." : "Add Task"}
    </button>
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
        <button
          onClick={onClearError}
          className="text-red-300 hover:text-white"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

// Custom hook for task management
const useTaskManagement = (
  user: any,
  createWithSync: any,
  updateWithSync: any,
  deleteWithSync: any,
  findByUserId: any,
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
        updatedAt: new Date(),
        category: "general",
      };

      const createdTask = await createWithSync("tasks", newTask);
      setTasks((prev) => [...prev, createdTask as DBTask]);
      setNewTaskText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<DBTask>) => {
    try {
      setError(null);
      const updatedTask = await updateWithSync("tasks", taskId, {
        ...updates,
        updatedAt: new Date(),
      });

      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, ...updatedTask } : task,
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
