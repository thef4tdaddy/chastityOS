import React from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';

const TaskApprovalSection = ({ tasks, onApprove, onReject }) => {
  const pendingTasks = tasks.filter(task => task.status === 'pending_approval');

  if (pendingTasks.length === 0) {
    return null; // Don't render anything if there are no tasks to approve
  }

  return (
    <div className="task-approval-box">
      <h4>Tasks Awaiting Approval</h4>
      <div className="task-approval-list">
        {pendingTasks.map(task => (
          <div key={task.id} className="task-review-item">
            <span className="task-review-text">
              {task.text}
            </span>
            <div className="task-review-actions">
              <button
                type="button"
                className="approve-button"
                onClick={() => onApprove(task.id)}
                aria-label={`Approve task: ${task.text}`}
              >
                <FaCheck />
                <span className="ml-2">Approve</span>
              </button>
              <button
                type="button"
                className="reject-button"
                onClick={() => onReject(task.id)}
                aria-label={`Reject task: ${task.text}`}
              >
                <FaTimes />
                <span className="ml-2">Reject</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskApprovalSection;