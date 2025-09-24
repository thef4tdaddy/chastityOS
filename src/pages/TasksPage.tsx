import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthState } from '../contexts';
import { taskDBService } from '../services/database';
import type { DBTask, TaskStatus } from '../types/database';
import { logger } from '../utils/logging';
import {
  FaCheckCircle,
  FaTimesCircle,
  FaTrophy,
  FaGavel,
  FaClock,
  FaArrowLeft,
} from 'react-icons/fa';

// Helper component for countdown timer
const CountdownTimer: React.FC<{ deadline: Date }> = ({ deadline }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const deadlineTime = deadline.getTime();
      const diff = deadlineTime - now;

      if (diff <= 0) {
        setIsOverdue(true);
        setTimeLeft('Overdue');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  return (
    <span className={`font-mono ${isOverdue ? 'text-red-400' : 'text-nightly-aquamarine'}`}>
      {timeLeft}
    </span>
  );
};

// Task item component
const TaskItem: React.FC<{
  task: DBTask;
  onSubmit: (taskId: string, note: string) => void;
}> = ({ task, onSubmit }) => {
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(task.id, note);
      setNote('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusConfig = (status: TaskStatus) => {
    switch (status) {
      case 'pending':
        return {
          icon: <FaClock className="text-nightly-aquamarine" />,
          text: 'Pending',
          borderColor: 'border-nightly-aquamarine',
        };
      case 'submitted':
        return {
          icon: <FaClock className="text-yellow-400" />,
          text: 'Submitted',
          borderColor: 'border-yellow-400',
        };
      case 'approved':
        return {
          icon: <FaCheckCircle className="text-green-400" />,
          text: 'Approved',
          borderColor: 'border-green-400',
        };
      case 'rejected':
        return {
          icon: <FaTimesCircle className="text-red-400" />,
          text: 'Rejected',
          borderColor: 'border-red-400',
        };
      case 'completed':
        return {
          icon: <FaTrophy className="text-nightly-lavender-floral" />,
          text: 'Completed',
          borderColor: 'border-nightly-lavender-floral',
        };
      default:
        return {
          icon: <FaClock className="text-gray-400" />,
          text: 'Unknown',
          borderColor: 'border-gray-400',
        };
    }
  };

  const statusConfig = getStatusConfig(task.status);
  const isOverdue = task.dueDate && new Date() > task.dueDate;

  return (
    <div className={`bg-white/10 backdrop-blur-sm border-l-4 ${statusConfig.borderColor} rounded-lg p-4 mb-4`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          {statusConfig.icon}
          <span className="text-sm font-medium text-nightly-spring-green">
            {statusConfig.text}
          </span>
          {task.priority && (
            <span className={`px-2 py-1 text-xs rounded ${
              task.priority === 'critical' ? 'bg-red-500/20 text-red-300' :
              task.priority === 'high' ? 'bg-orange-500/20 text-orange-300' :
              task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
              'bg-gray-500/20 text-gray-300'
            }`}>
              {task.priority.toUpperCase()}
            </span>
          )}
        </div>
        {task.dueDate && (
          <div className="text-right">
            <div className="text-xs text-nightly-celadon">Due in:</div>
            <CountdownTimer deadline={task.dueDate} />
            {isOverdue && (
              <div className="text-xs text-red-400 mt-1">OVERDUE</div>
            )}
          </div>
        )}
      </div>

      {/* Task content */}
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-nightly-honeydew mb-2">
          {task.text}
        </h3>
        {task.description && (
          <p className="text-nightly-celadon text-sm mb-2">
            {task.description}
          </p>
        )}
      </div>

      {/* Dates */}
      <div className="flex gap-4 text-xs text-nightly-celadon mb-3">
        <span>Created: {task.createdAt.toLocaleDateString()}</span>
        {task.submittedAt && (
          <span>Submitted: {task.submittedAt.toLocaleDateString()}</span>
        )}
        {task.approvedAt && (
          <span>Approved: {task.approvedAt.toLocaleDateString()}</span>
        )}
      </div>

      {/* Feedback */}
      {task.keyholderFeedback && (
        <div className="bg-nightly-lavender-floral/10 border border-nightly-lavender-floral/20 rounded p-2 mb-3">
          <div className="text-xs text-nightly-lavender-floral mb-1">Keyholder Feedback:</div>
          <div className="text-sm text-nightly-honeydew">{task.keyholderFeedback}</div>
        </div>
      )}

      {/* Consequence */}
      {task.consequence && (
        <div className={`rounded p-2 mb-3 ${
          task.consequence.type === 'reward'
            ? 'bg-green-500/10 border border-green-500/20'
            : 'bg-red-500/10 border border-red-500/20'
        }`}>
          <div className="flex items-center gap-2">
            {task.consequence.type === 'reward' ? (
              <FaTrophy className="text-green-400" />
            ) : (
              <FaGavel className="text-red-400" />
            )}
            <span className={`text-xs font-medium ${
              task.consequence.type === 'reward' ? 'text-green-400' : 'text-red-400'
            }`}>
              {task.consequence.type.toUpperCase()}
            </span>
          </div>
          <div className="text-sm text-nightly-honeydew mt-1">
            {task.consequence.description}
          </div>
          {task.consequence.duration && (
            <div className="text-xs text-nightly-celadon mt-1">
              Duration: {Math.abs(task.consequence.duration)} seconds {
                task.consequence.duration > 0 ? 'added' : 'reduced'
              }
            </div>
          )}
        </div>
      )}

      {/* Submit section for pending tasks */}
      {task.status === 'pending' && (
        <div className="border-t border-white/10 pt-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add submission notes (optional)..."
            className="w-full bg-white/5 border border-white/10 rounded p-2 text-nightly-honeydew placeholder-nightly-celadon/50 resize-none"
            rows={3}
          />
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="mt-2 bg-nightly-lavender-floral hover:bg-nightly-lavender-floral/80 disabled:opacity-50 text-white px-4 py-2 rounded transition-colors"
          >
            {isSubmitting ? 'Submitting...' : 'Submit for Review'}
          </button>
        </div>
      )}
    </div>
  );
};

const TasksPage: React.FC = () => {
  const { user } = useAuthState();
  const [tasks, setTasks] = useState<DBTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');

  useEffect(() => {
    const fetchTasks = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const userTasks = await taskDBService.findByUserId(user.uid);
        setTasks(userTasks);
      } catch (error) {
        logger.error('Error fetching tasks:', error, 'TasksPage');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [user]);

  const handleSubmitTask = async (taskId: string, note: string) => {
    try {
      await taskDBService.updateTaskStatus(taskId, 'submitted', note);

      // Update local state
      setTasks(prev => prev.map(task =>
        task.id === taskId
          ? {
              ...task,
              status: 'submitted' as TaskStatus,
              submittedAt: new Date(),
              submissiveNote: note
            }
          : task
      ));
    } catch (error) {
      logger.error('Error submitting task:', error, 'TasksPage');
    }
  };

  const activeTasks = tasks.filter(task =>
    ['pending', 'submitted'].includes(task.status)
  );

  const archivedTasks = tasks.filter(task =>
    ['approved', 'rejected', 'completed', 'cancelled'].includes(task.status)
  );

  return (
    <div className="bg-gradient-to-br from-nightly-mobile-bg to-nightly-desktop-bg min-h-screen text-nightly-spring-green">
      {/* Header */}
      <header className="p-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="text-nightly-aquamarine hover:text-nightly-spring-green">
            <FaArrowLeft />
          </Link>
          <h1 className="text-2xl font-bold">Tasks</h1>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="p-4">
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'active'
                ? 'bg-nightly-aquamarine text-black'
                : 'bg-white/10 text-nightly-celadon hover:bg-white/20'
            }`}
          >
            Active Tasks ({activeTasks.length})
          </button>
          <button
            onClick={() => setActiveTab('archived')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'archived'
                ? 'bg-nightly-aquamarine text-black'
                : 'bg-white/10 text-nightly-celadon hover:bg-white/20'
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
            {activeTab === 'active' ? (
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
            ) : (
              archivedTasks.length > 0 ? (
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
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TasksPage;