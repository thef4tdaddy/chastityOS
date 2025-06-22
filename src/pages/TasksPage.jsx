import React, { useState, useMemo } from 'react';

// This component provides a comprehensive view of all tasks, sorted by their status.
const TasksPage = ({ tasks = [], updateTaskStatus }) => {
  // Local state to hold the notes for pending tasks. The key is the task ID.
  const [notes, setNotes] = useState({});

  // Memoized sorting of tasks to prevent recalculation on every render
  const { pendingTasks, submittedTasks, archivedTasks } = useMemo(() => {
    const pending = tasks.filter(task => task.status === 'pending');
    const submitted = tasks.filter(task => task.status === 'submitted');
    // Archived tasks are any that are not pending or submitted
    const archived = tasks.filter(task => task.status !== 'pending' && task.status !== 'submitted');
    return { pendingTasks: pending, submittedTasks: submitted, archivedTasks: archived };
  }, [tasks]);

  // Handler to update the note for a specific task
  const handleNoteChange = (taskId, note) => {
    setNotes(prev => ({ ...prev, [taskId]: note }));
  };

  // Handler to submit a task for review, now including the note
  const handleSubmitForReview = (taskId) => {
    if (updateTaskStatus) {
      const note = notes[taskId] || ''; // Get the note for the specific task
      updateTaskStatus(taskId, 'submitted', { userNote: note });
      // Clear the note from local state after submission
      setNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[taskId];
        return newNotes;
      });
    }
  };

  return (
    <div className="tasks-container p-4 md:p-6">
      <h3 className="subpage-title mb-6">Your Task Board</h3>

      {/* Section 1: Tasks to Do (Pending) */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-blue-300 mb-3 border-b-2 border-blue-800 pb-2">Tasks to Do</h4>
        <div className="task-list space-y-4">
          {pendingTasks.length > 0 ? (
            pendingTasks.map((task) => (
              <div key={task.id} className="task-item bg-gray-800/50 p-4 rounded-lg shadow-md">
                <p className="task-text text-gray-200 mb-3">{task.text}</p>
                <textarea
                  className="inputbox-blue w-full bg-transparent mb-3"
                  placeholder="Add an optional note for your keyholder..."
                  value={notes[task.id] || ''}
                  onChange={(e) => handleNoteChange(task.id, e.target.value)}
                />
                <button
                  onClick={() => handleSubmitForReview(task.id)}
                  className="submit-button button-blue w-full"
                  aria-label="Submit task for review"
                >
                  Submit for Completion Review
                </button>
              </div>
            ))
          ) : (
            <p className="no-tasks-message text-gray-400 italic p-4 bg-gray-800/50 rounded-lg">No pending tasks. Great job!</p>
          )}
        </div>
      </div>

      {/* Section 2: Tasks Waiting for Review (Submitted) */}
      <div className="mb-8">
        <h4 className="submitted-title text-lg font-semibold text-yellow-300 mb-3 border-b-2 border-yellow-800 pb-2">Tasks Waiting for Review</h4>
        <div className="task-list space-y-3">
          {submittedTasks.length > 0 ? (
            submittedTasks.map((task) => (
              <div key={task.id} className="task-item submitted bg-gray-800/50 p-4 rounded-lg flex items-center justify-between shadow-md">
                <span className="task-text text-gray-500 line-through">{task.text}</span>
                <span className="submitted-status text-yellow-400 font-semibold">Submitted</span>
              </div>
            ))
          ) : (
            <p className="no-tasks-message text-gray-400 italic p-4 bg-gray-800/50 rounded-lg">No tasks are currently waiting for review.</p>
          )}
        </div>
      </div>

      {/* Section 3: Task Archive (Completed) */}
      <div>
        <h4 className="text-lg font-semibold text-green-300 mb-3 border-b-2 border-green-800 pb-2">Task Archive</h4>
        <div className="task-list space-y-3">
          {archivedTasks.length > 0 ? (
            archivedTasks.map((task) => (
              <div key={task.id} className={`task-item archived p-4 rounded-lg shadow-md bg-gray-900/60 border-l-4 ${task.status === 'approved' ? 'border-green-500' : 'border-red-500'}`}>
                <p className="task-text text-gray-500 line-through">{task.text}</p>
                <div className="mt-2">
                  <p className={`font-bold ${task.status === 'approved' ? 'text-green-400' : 'text-red-400'}`}>
                    Status: {task.status === 'approved' ? 'Approved' : 'Denied'}
                  </p>
                  {task.outcome && <p className="text-sm text-gray-400">Outcome: {task.outcome}</p>}
                </div>
              </div>
            ))
          ) : (
             <p className="no-tasks-message text-gray-400 italic p-4 bg-gray-800/50 rounded-lg">Your task history will appear here.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TasksPage;
