/**
 * Dexie Demo Component
 * Demonstrates offline-first functionality with Dexie
 */
import React, { useState, useEffect } from "react";
import { useDexieSync } from "@/hooks/useDexieSync";
import { useOfflineDemo } from "@/hooks/useOfflineDemo";
import { useAuth } from "@/contexts/AuthContext";
import type { DBTask } from "@/types/database";

export const DexieDemo: React.FC = () => {
  const { user } = useAuth();
  const {
    services,
    createWithSync,
    updateWithSync,
    deleteWithSync,
    findByUserId,
    isOnline,
    syncStatus,
    triggerSync,
  } = useDexieSync();

  const { simulateOffline, simulateOnline, forceOffline } = useOfflineDemo();

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
      const taskData = {
        id: crypto.randomUUID(),
        userId: user.uid,
        text: newTaskText.trim(),
        description: "Demo task created via Dexie",
        status: "pending" as const,
        priority: "medium" as const,
        assignedBy: "submissive" as const,
        createdAt: new Date(),
      };

      await createWithSync("tasks", taskData);

      // Reload tasks to show the new one
      const updatedTasks = await findByUserId("tasks", user.uid);
      setTasks(updatedTasks as DBTask[]);
      setNewTaskText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    }
  };

  const handleUpdateTask = async (taskId: string, status: DBTask["status"]) => {
    try {
      setError(null);
      await updateWithSync("tasks", taskId, { status });

      // Update local state
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? { ...task, status } : task)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      setError(null);
      await deleteWithSync("tasks", taskId);

      // Remove from local state
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task");
    }
  };

  const handleManualSync = async () => {
    try {
      setError(null);
      await triggerSync();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    }
  };

  if (!user) {
    return (
      <div className="p-4 bg-gray-800 rounded-lg">
        <p className="text-gray-400">Please log in to use the Dexie demo</p>
      </div>
    );
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

      {/* Status indicators */}
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

        {/* Offline simulation buttons */}
        <div className="flex space-x-2">
          <button
            onClick={simulateOffline}
            disabled={forceOffline}
            className="px-2 py-1 bg-red-700 hover:bg-red-600 disabled:bg-gray-600 text-white text-xs rounded"
          >
            Simulate Offline
          </button>
          <button
            onClick={simulateOnline}
            disabled={!forceOffline}
            className="px-2 py-1 bg-green-700 hover:bg-green-600 disabled:bg-gray-600 text-white text-xs rounded"
          >
            Go Online
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Add new task */}
      <div className="mb-6">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="Enter a task description..."
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400"
            onKeyPress={(e) => e.key === "Enter" && handleAddTask()}
          />
          <button
            onClick={handleAddTask}
            disabled={!newTaskText.trim() || loading}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded transition-colors"
          >
            Add Task
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          This will save to IndexedDB first, then sync to Firebase when online
        </p>
      </div>

      {/* Tasks list */}
      <div className="space-y-2 mb-4">
        {loading ? (
          <p className="text-gray-400">Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p className="text-gray-400">No tasks yet. Add one above!</p>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between p-3 bg-gray-700 rounded"
            >
              <div className="flex-1">
                <p className="text-white">{task.text}</p>
                <p className="text-xs text-gray-400">
                  Status: {task.status} • Created:{" "}
                  {task.createdAt.toLocaleString()}
                </p>
              </div>
              <div className="flex space-x-2">
                {task.status === "pending" && (
                  <button
                    onClick={() => handleUpdateTask(task.id, "completed")}
                    className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded"
                  >
                    Complete
                  </button>
                )}
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Manual sync button */}
      <div className="flex justify-between items-center">
        <p className="text-xs text-gray-400">
          Tasks: {tasks.length} • Pending sync:{" "}
          {tasks.filter((t) => t.syncStatus === "pending").length}
        </p>
        <button
          onClick={handleManualSync}
          disabled={!isOnline}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-xs rounded"
        >
          Manual Sync
        </button>
      </div>
    </div>
  );
};
