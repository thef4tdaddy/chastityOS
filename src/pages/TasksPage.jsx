// src/pages/TasksPage.jsx
import React from 'react';

const CheckIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> );

// This component displays tasks and allows the user to submit them for review.
const TasksPage = ({ tasks = [], handleSubmitForReview }) => {
  
  // Filter for tasks that are still pending and assigned to the user
  const pendingTasks = tasks.filter(task => task.status === 'pending');
  const submittedTasks = tasks.filter(task => task.status === 'submitted');

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
                className="submit-button" /* Using a new class for styling */
                aria-label="Submit task for review"
              >
                Submit for Review
              </button>
            </div>
          ))
        ) : (
          <p className="no-tasks-message">No pending tasks. Great job!</p>
        )}
      </div>

      {submittedTasks.length > 0 && (
        <div className="submitted-tasks-section">
          <h4 className="submitted-title">Pending Keyholder Review</h4>
          <div className="task-list">
            {submittedTasks.map((task) => (
              <div key={task.id} className="task-item submitted">
                <span className="task-text">{task.text}</span>
                <span className="submitted-status">Submitted</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksPage;
