import React, { useState } from 'react';
import { FaPlusCircle, FaExclamationTriangle } from 'react-icons/fa';

const KeyholderAddTaskForm = ({ onAddTask, tasks = [] }) => {
  const [taskText, setTaskText] = useState('');
  const [deadline, setDeadline] = useState('');
  const [recurrenceDays, setRecurrenceDays] = useState('');
  const [recurrenceEnd, setRecurrenceEnd] = useState('');
  const [rewardType, setRewardType] = useState('none');
  const [rewardValue, setRewardValue] = useState('');
  const [punishmentType, setPunishmentType] = useState('none');
  const [punishmentValue, setPunishmentValue] = useState('');

  // New state to control the error modal's visibility
  const [showErrorModal, setShowErrorModal] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!taskText.trim()) {
      alert('Please enter a task description.');
      return;
    }

    // Deadline Validation
    if (deadline && new Date(deadline) < new Date()) {
      // Show the modal instead of an alert
      setShowErrorModal(true);
      return;
    }

    const taskData = {
      text: taskText.trim(),
      deadline: deadline ? new Date(deadline) : null,
      recurrenceDays: recurrenceDays ? parseInt(recurrenceDays, 10) : 0,
      recurrenceEnd: recurrenceEnd ? new Date(recurrenceEnd) : null,
      recurrenceId: recurrenceDays ? crypto.randomUUID() : undefined,
      recurrenceCancelled: false,
      reward: {
        type: rewardType,
        value: rewardType === 'time' ? Number(rewardValue) * 3600 : rewardValue,
      },
      punishment: {
        type: punishmentType,
        value: punishmentType === 'time' ? Number(punishmentValue) * 3600 : punishmentValue,
      },
    };

    onAddTask(taskData);

    // Reset form fields
    setTaskText('');
    setDeadline('');
    setRecurrenceDays('');
    setRecurrenceEnd('');
    setRewardType('none');
    setRewardValue('');
    setPunishmentType('none');
    setPunishmentValue('');
  };

  const recentTasks = tasks
    .filter(t => t.text)
    .sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 3);

  const [showSuggestions, setShowSuggestions] = useState(false);

  return (
    <>
      <div className="tasks-container">
        <h4 className="text-lg font-semibold mb-3 pb-2 border-b border-blue-800">Assign a New Task</h4>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <label htmlFor="task-text" className="block text-xs font-medium mb-1">Task Description</label>
            <input
              id="task-text"
              type="text"
              value={taskText}
              onChange={(e) => setTaskText(e.target.value)}
              placeholder="e.g., Polish my boots"
              className="w-full"
              required
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
            />
            {showSuggestions && recentTasks.length > 0 && (
              <ul className="absolute z-10 w-full bg-gray-800 border border-gray-600 rounded-md mt-1">
                {recentTasks.map(task => (
                  <li
                    key={task.id}
                    className="px-3 py-2 hover:bg-gray-700 cursor-pointer"
                    onMouseDown={() => {
                      setTaskText(task.text);
                      setShowSuggestions(false);
                    }}
                  >
                    {task.text}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label htmlFor="task-deadline" className="block text-xs font-medium mb-1">Complete By (Optional)</label>
            <input id="task-deadline" type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="recurrence-days" className="block text-xs font-medium mb-1">Repeat Every (days)</label>
              <input id="recurrence-days" type="number" min="0" value={recurrenceDays} onChange={(e) => setRecurrenceDays(e.target.value)} className="w-full" />
            </div>
            <div>
              <label htmlFor="recurrence-end" className="block text-xs font-medium mb-1">Repeat Until (Optional)</label>
              <input id="recurrence-end" type="datetime-local" value={recurrenceEnd} onChange={(e) => setRecurrenceEnd(e.target.value)} className="w-full" />
            </div>
          </div>

          <fieldset className="p-3 border border-blue-800 rounded-md">
            <legend className="px-2 text-sm font-semibold">Reward for Completion</legend>
            <div className="flex flex-col sm:flex-row gap-4 mt-2">
              <select value={rewardType} onChange={(e) => setRewardType(e.target.value)} className="flex-grow">
                <option value="none">No Reward</option>
                <option value="time">Reduce Chastity Time</option>
                <option value="note">Other (Custom Note)</option>
              </select>
              {rewardType === 'time' && <input type="number" value={rewardValue} onChange={(e) => setRewardValue(e.target.value)} placeholder="Hours" className="w-full sm:w-24" />}
              {rewardType === 'note' && <input type="text" value={rewardValue} onChange={(e) => setRewardValue(e.target.value)} placeholder="Describe reward..." className="flex-grow" />}
            </div>
          </fieldset>

          <fieldset className="p-3 border border-blue-800 rounded-md">
            <legend className="px-2 text-sm font-semibold">Punishment for Failure</legend>
            <div className="flex flex-col sm:flex-row gap-4 mt-2">
              <select value={punishmentType} onChange={(e) => setPunishmentType(e.target.value)} className="flex-grow">
                <option value="none">No Punishment</option>
                <option value="time">Increase Chastity Time</option>
                <option value="note">Other (Custom Note)</option>
              </select>
              {punishmentType === 'time' && <input type="number" value={punishmentValue} onChange={(e) => setPunishmentValue(e.target.value)} placeholder="Hours" className="w-full sm:w-24" />}
              {punishmentType === 'note' && <input type="text" value={punishmentValue} onChange={(e) => setPunishmentValue(e.target.value)} placeholder="Describe punishment..." className="flex-grow" />}
            </div>
          </fieldset>

          <button type="submit" className="w-full flex items-center justify-center gap-2 font-bold py-2">
            <FaPlusCircle /> Add Task
          </button>
        </form>
      </div>

      {/* --- NEW: Error Modal --- */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 border-2 border-red-500 rounded-lg shadow-2xl p-6 w-full max-w-md text-center">
            <div className="flex justify-center mb-4">
              <FaExclamationTriangle className="text-5xl text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-red-300 mb-4">Invalid Date</h2>
            <p className="text-gray-300 mb-6">
              Cannot set a deadline in the past. Please choose a future date and time.
            </p>
            <button
              onClick={() => setShowErrorModal(false)}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition duration-300"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default KeyholderAddTaskForm;