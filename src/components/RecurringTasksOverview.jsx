import React from 'react';
import { formatTime } from '../utils';

const RecurringTasksOverview = ({ tasks = [], onCancel }) => {
  // Gather active recurring tasks grouped by recurrenceId
  const groups = {};
  tasks.forEach((task) => {
    if (task.recurrenceDays > 0 && !task.recurrenceCancelled) {
      const id = task.recurrenceId || task.id;
      if (!groups[id]) {
        groups[id] = {
          id,
          text: task.text,
          recurrenceDays: task.recurrenceDays,
          recurrenceEnd: task.recurrenceEnd,
          nextDeadline: null,
        };
      }
      if (
        task.status === 'pending' &&
        (!groups[id].nextDeadline ||
          (task.deadline && task.deadline < groups[id].nextDeadline))
      ) {
        groups[id].nextDeadline = task.deadline || null;
      }
    }
  });

  const entries = Object.values(groups);
  if (entries.length === 0) return null;

  return (
    <div className="tasks-container mb-6">
      <h4 className="subpage-title mb-3">Recurring Tasks</h4>
      <div className="task-list space-y-3">
        {entries.map((entry) => (
          <div key={entry.id} className="task-item flex-col items-start !p-3">
            <div className="w-full flex justify-between items-center">
              <span className="task-text">{entry.text}</span>
              {onCancel && (
                <button
                  type="button"
                  onClick={() => onCancel(entry.id)}
                  className="delete-button"
                >
                  Cancel
                </button>
              )}
            </div>
            <div className="w-full text-left text-xs mt-1 text-blue-300">
              Repeats every {entry.recurrenceDays} day
              {entry.recurrenceDays === 1 ? '' : 's'}
              {entry.recurrenceEnd && (
                <> until {formatTime(safeToDate(entry.recurrenceEnd), true)}</>
              )}
            </div>
            {entry.nextDeadline && (
              <div className="w-full text-left text-xs mt-1 text-red-300">
                Next due {formatTime(safeToDate(entry.nextDeadline), true)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecurringTasksOverview;
