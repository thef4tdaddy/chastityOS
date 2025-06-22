import React from 'react';

// Helper function to format Firestore timestamps
const formatTimestamp = (timestamp) => {
    if (!timestamp || typeof timestamp.toDate !== 'function') return 'N/A';
    return timestamp.toDate().toLocaleString();
};

const TaskReviewSection = ({ submittedTasks, reviewData, handleReviewChange, handleTaskReview }) => {
    return (
        <div className="my-6 p-4 border border-yellow-500 rounded-lg">
            <h4 className="title-yellow !text-yellow-300 mb-4">Tasks for Review</h4>
            {submittedTasks.length > 0 ? (
                <div className="space-y-4">
                    {submittedTasks.map(task => (
                        <div key={task.id} className="bg-gray-800/60 p-4 rounded-lg">
                            <p className="text-gray-300"><span className="font-bold">Task:</span> {task.text}</p>
                            {task.userNote && <p className="text-sm text-gray-400 italic mt-1">Submissive's Note: "{task.userNote}"</p>}
                            <p className="text-xs text-yellow-200 mt-1">Submitted: {formatTimestamp(task.submittedAt)}</p>

                            <div className="mt-3 space-y-2">
                                <input type="text"
                                    className="inputbox-yellow w-full bg-transparent"
                                    placeholder="Add a note (optional)"
                                    value={reviewData[task.id]?.note || ''}
                                    onChange={e => handleReviewChange(task.id, 'note', e.target.value)}
                                />
                                <input type="number"
                                    className="inputbox-yellow w-full bg-transparent"
                                    placeholder="Time adjustment in days (+/-)"
                                    value={reviewData[task.id]?.days || ''}
                                    onChange={e => handleReviewChange(task.id, 'days', e.target.value)}
                                />
                            </div>
                            <div className="flex justify-end gap-x-2 mt-3">
                                <button onClick={() => handleTaskReview(task.id, 'denied')} className="button-red !text-red-300">Deny</button>
                                <button onClick={() => handleTaskReview(task.id, 'approved')} className="button-green !text-green-300">Approve</button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-400 italic">No tasks are currently waiting for review.</p>
            )}
        </div>
    );
};

export default TaskReviewSection;
