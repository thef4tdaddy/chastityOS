import React from 'react';

const TasksPage = (props) => {
  // DEBUG: Log all props arriving at this component
  console.log("[DEBUG] TasksPage: Received props:", props);

  // Destructure tasks from props AFTER logging
  const { tasks = [], handleSubmitForReview } = props;

  const pendingTasks = tasks.filter(task => task.assignedBy === 'keyholder' && task.status === 'pending');
  const submittedTasks = tasks.filter(task => task.status === 'pending_approval');

  return (
    <div className="tasks-container">
      <h3 className="subpage-title mb-4">Your Assigned Tasks</h3>

      <div className="task-list">
        {pendingTasks.length > 0 ? (
          pendingTasks.map((task) => (
            <div key={task.id} className="task-item">
              <span className="task-text flex-grow">{task.text}</span>
              <button
                onClick={() => handleSubmitForReview(task.id)}
                className="complete-button"
                aria-label={`Submit task for review: ${task.text}`}
              >
                Submit for Review
              </button>
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
    </div>
  );
};

export default TasksPage;