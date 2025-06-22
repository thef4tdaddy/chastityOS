import React, { useState } from 'react';

const AssignTaskSection = ({ handleAddTask }) => {
    const [taskInput, setTaskInput] = useState('');

    const onAddTaskClick = () => {
        if (taskInput.trim() && handleAddTask) {
            handleAddTask(taskInput);
            setTaskInput('');
        }
    };

    return (
        <div className="my-6 p-4 border border-blue-500 rounded-lg">
            <h4 className="title-blue !text-blue-300 mb-2">Assign a New Task</h4>
            <p className="text-xs text-gray-400 mb-3">Assign a task that the submissive must complete and submit for review.</p>
            <input
                type="text"
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                placeholder="Enter a new task description"
                className="inputbox-blue !text-blue-300 w-full mb-2 bg-transparent"
            />
            <button onClick={onAddTaskClick} className="button-blue !text-blue-300 mt-2">
                Assign Task
            </button>
        </div>
    );
};

export default AssignTaskSection;
