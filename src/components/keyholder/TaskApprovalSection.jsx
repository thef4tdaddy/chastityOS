import React from 'react';
import { FaCheck, FaTimes, FaCommentAlt } from 'react-icons/fa';
import { formatTime } from '../../utils'; // Assuming this utility exists

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
          <div key={task.id} className="task-review-item flex-col items-start !p-3">
            {/* Top row with task text and action buttons */}
            <div className="w-full flex justify-between items-center">
              <span className="task-review-text">{task.text}</span>
              <div className="task-review-actions">
                <button
                  type="button"
                  className="approve-button"
                  onClick={() => onApprove(task.id)}
                  aria-label={`Approve task: ${task.text}`}
                >
                  <FaCheck />
                  <span className="ml-2 hidden sm:inline">Approve</span>
                </button>
                <button
                  type="button"
                  className="reject-button"
                  onClick={() => onReject(task.id)}
                  aria-label={`Reject task: ${task.text}`}
                >
                  <FaTimes />
                  <span className="ml-2 hidden sm:inline">Reject</span>
                </button>
              </div>
            </div>

            {/* --- THIS IS THE NEW SECTION --- */}
            {/* Bottom row to display the submissive's note and submission time */}
            <div className="w-full mt-2 pt-2 border-t border-gray-700/50 text-xs text-gray-400 flex justify-between items-center">
              {task.submissiveNote ? (
                <span className="italic flex items-center">
                  <FaCommentAlt className="mr-2 flex-shrink-0" /> {task.submissiveNote}
                </span>
              ) : (
                <span className="italic">No note provided.</span>
              )}
              {task.submittedAt && (
                <span className="font-mono text-gray-500 flex-shrink-0 ml-2">
                  {formatTime(safeToDate(task.submittedAt), true)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskApprovalSection;