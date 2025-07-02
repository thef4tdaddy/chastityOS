import React, { useState } from 'react';
import { formatElapsedTime, formatTime } from '../utils';
import useCountdown from '../hooks/useCountdown';
import { FaCheckCircle, FaTimesCircle, FaTrophy, FaGavel } from 'react-icons/fa';
import RecurringTasksOverview from '../components/RecurringTasksOverview';

// Helper component for the countdown display
const CountdownTimer = ({ deadline }) => {
  const { days, hours, minutes, seconds, isOverdue } = useCountdown(deadline);

  if (isOverdue) {
    return <span className="font-mono text-red-400">Overdue</span>;
  }

  return (
    <span className="font-mono text-blue-300">
      {`${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`}
    </span>
  );
};

const ArchivedTaskItem = ({ task }) => {
  const statusText = (task.status || '').trim().toLowerCase();
  const isApproved = statusText === 'approved';
  const consequence = isApproved ? task.reward : task.punishment;

  const statusConfig = {
    approved: {
      icon: <FaCheckCircle className="text-green-400" />,
      text: 'Approved',
      borderColor: 'border-green-800',
    },
    rejected: {
      icon: <FaTimesCircle className="text-red-400" />,
      text: 'Rejected',
      borderColor: 'border-red-800',
    }
  };

  const currentStatus = statusConfig[statusText] || {};

  return (
    <div className={`task-item flex-col items-start !p-3 border-l-4 ${currentStatus.borderColor}`}>
      <div className="flex justify-between w-full">
        <span className="task-text line-through opacity-70">{task.text}</span>
        <span className="flex items-center text-sm font-semibold gap-2">
          {currentStatus.icon} {currentStatus.text}
        </span>
      </div>

      {consequence && consequence.type !== 'none' && (
        <div className="w-full mt-2 pt-2 border-t border-gray-700/50 text-xs flex items-center gap-2">
          {isApproved ? <FaTrophy className="text-yellow-400" /> : <FaGavel className="text-orange-400" />}
          <span className="font-semibold">{isApproved ? 'Reward:' : 'Punishment:'}</span>
          {consequence.type === 'time' && (
            <span className="font-mono">{formatElapsedTime(consequence.value)} {isApproved ? 'removed' : 'added'}</span>
          )}
          {consequence.type === 'note' && (
            <span className="italic">{consequence.value}</span>
          )}
        </div>
      )}
      {task.recurrenceDays > 0 && (
        <div className="w-full text-left text-xs mt-1 text-blue-300">
          Repeats every {task.recurrenceDays} day{task.recurrenceDays === 1 ? '' : 's'}
          {task.recurrenceEnd && (
            <> until {formatTime(task.recurrenceEnd, true)}</>
          )}
        </div>
      )}
    </div>
  );
};

const TasksPage = ({ tasks = [], handleSubmitForReview, savedSubmissivesName }) => {
  const [notes, setNotes] = useState({});

  const handleNoteChange = (taskId, text) => {
    setNotes(prev => ({ ...prev, [taskId]: text }));
  };

  const pendingTasks = tasks.filter(task => {
    const status = (task.status || '').trim().toLowerCase();
    return status === 'pending';
  });
  const submittedTasks = tasks.filter(task => {
    const status = (task.status || '').trim().toLowerCase();
    return status === 'pending_approval';
  });
  const archivedTasks = tasks.filter(task => {
    const status = (task.status || '').trim().toLowerCase();
    return status === 'approved' || status === 'rejected';
  });

  const pageTitle = savedSubmissivesName ? `${savedSubmissivesName}'s Tasks` : 'Your Assigned Tasks';
  const archiveTitle = savedSubmissivesName ? `${savedSubmissivesName}'s Archive` : 'Task Archive';

  return (
    <div className="tasks-container">
      <h3 className="subpage-title mb-4">{pageTitle}</h3>

      <RecurringTasksOverview tasks={tasks} />

      <div className="task-list space-y-4">
        {pendingTasks.length > 0 ? (
          pendingTasks.map((task) => (
            <div key={task.id} className="task-item flex-col items-start !p-4">
              <div className="flex justify-between w-full">
                <span className="task-text">{task.text}</span>
              </div>
              {task.deadline && (
                <div className="w-full text-left text-sm mt-2 flex justify-between items-center">
                  <span className="text-red-300"><strong>Due:</strong> {formatTime(task.deadline, true)}</span>
                  <CountdownTimer deadline={task.deadline} />
                </div>
              )}

              {task.recurrenceDays > 0 && (
                <div className="w-full text-left text-xs mt-1 text-blue-300">
                  Repeats every {task.recurrenceDays} day{task.recurrenceDays === 1 ? '' : 's'}
                  {task.recurrenceEnd && (
                    <> until {formatTime(task.recurrenceEnd, true)}</>
                  )}
                </div>
              )}

              {(task.reward?.type !== 'none' || task.punishment?.type !== 'none') && (
                <div className="w-full mt-2 pt-2 border-t border-gray-700/50 text-xs space-y-1">
                  {task.reward && task.reward.type !== 'none' && (
                    <div className="flex items-center gap-2 text-yellow-300">
                      <FaTrophy className="text-yellow-400" />
                      <span className="font-semibold">Reward:</span>
                      {task.reward.type === 'time' ? (
                        <span className="font-mono">{formatElapsedTime(task.reward.value)} removed</span>
                      ) : (
                        <span className="italic">{task.reward.value}</span>
                      )}
                    </div>
                  )}
                  {task.punishment && task.punishment.type !== 'none' && (
                    <div className="flex items-center gap-2 text-orange-300">
                      <FaGavel className="text-orange-400" />
                      <span className="font-semibold">Punishment:</span>
                      {task.punishment.type === 'time' ? (
                        <span className="font-mono">{formatElapsedTime(task.punishment.value)} added</span>
                      ) : (
                        <span className="italic">{task.punishment.value}</span>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="w-full mt-3 flex flex-col sm:flex-row items-stretch gap-2">
                <input
                  type="text"
                  value={notes[task.id] || ''}
                  onChange={(e) => handleNoteChange(task.id, e.target.value)}
                  placeholder="Add a note (optional)..."
                  className="flex-grow bg-gray-900/50 border-gray-700"
                />
                <button
                  onClick={() => handleSubmitForReview(task.id, notes[task.id] || '')}
                  className="complete-button w-full sm:w-auto"
                  aria-label={`Submit task for review: ${task.text}`}
                >
                  Submit for Review
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="no-tasks-message">You have no pending tasks from your Keyholder. Great job!</p>
        )}
      </div>

      {submittedTasks.length > 0 && (
        <div className="mt-6">
          <h4 className="subpage-title mb-3">Awaiting Keyholder Review</h4>
          <div className="task-list">
            {submittedTasks.map((task) => (
              <div key={task.id} className="task-item opacity-70">
                <span className="task-text flex-grow line-through">{task.text}</span>
                <span className="text-sm font-semibold text-yellow-300">Submitted</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {archivedTasks.length > 0 && (
        <div className="mt-8">
          <h3 className="subpage-title mb-4">{archiveTitle}</h3>
          <div className="task-list space-y-3">
            {archivedTasks.map((task) => (
              <ArchivedTaskItem key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksPage;