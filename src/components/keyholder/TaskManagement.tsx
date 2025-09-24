import React, { useState } from 'react';
import type { DBTask, TaskStatus } from '../../types/database';
import { taskDBService } from '../../services/database';
import {
  FaTasks,
  FaPlus,
  FaCheckCircle,
  FaTimesCircle,
} from 'react-icons/fa';

// Task Management for Keyholder
interface TaskManagementProps {
  tasks: DBTask[];
}

export const TaskManagement: React.FC<TaskManagementProps> = ({ tasks }) => {
  const [newTaskText, setNewTaskText] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);

  const pendingTasks = tasks.filter(t => ['pending', 'submitted'].includes(t.status));

  const handleTaskAction = async (taskId: string, action: 'approve' | 'reject', feedback?: string) => {
    try {
      const newStatus: TaskStatus = action === 'approve' ? 'approved' : 'rejected';
      await taskDBService.updateTaskStatus(taskId, newStatus, feedback);
      // In real app, this would refresh the tasks
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <FaTasks className="text-nightly-lavender-floral" />
          <h3 className="text-lg font-semibold text-nightly-honeydew">Task Management</h3>
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
          <h4 className="font-medium text-nightly-honeydew mb-3">Create New Task</h4>
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
                onClick={() => {
                  // In real app, would call taskDBService.create
                  setNewTaskText('');
                  setShowAddTask(false);
                }}
                disabled={!newTaskText.trim()}
                className="bg-nightly-aquamarine hover:bg-nightly-aquamarine/80 disabled:opacity-50 text-black px-4 py-2 rounded font-medium transition-colors"
              >
                Create Task
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

      <div className="space-y-3">
        {pendingTasks.length === 0 ? (
          <p className="text-nightly-celadon">No pending tasks</p>
        ) : (
          pendingTasks.map((task) => (
            <div key={task.id} className="bg-white/5 rounded-lg p-4">
              <div className="mb-3">
                <h4 className="font-medium text-nightly-honeydew mb-1">{task.text}</h4>
                <div className="flex items-center gap-2 text-sm text-nightly-celadon">
                  <span>Status: {task.status}</span>
                  <span>•</span>
                  <span>Priority: {task.priority}</span>
                  {task.dueDate && (
                    <>
                      <span>•</span>
                      <span>Due: {task.dueDate.toLocaleDateString()}</span>
                    </>
                  )}
                </div>
              </div>

              {task.submissiveNote && (
                <div className="bg-white/5 rounded p-2 mb-3">
                  <div className="text-xs text-nightly-celadon mb-1">Submissive Note:</div>
                  <div className="text-sm text-nightly-honeydew">{task.submissiveNote}</div>
                </div>
              )}

              {task.status === 'submitted' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleTaskAction(task.id, 'approve')}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                  >
                    <FaCheckCircle />
                    Approve
                  </button>
                  <button
                    onClick={() => handleTaskAction(task.id, 'reject')}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                  >
                    <FaTimesCircle />
                    Reject
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