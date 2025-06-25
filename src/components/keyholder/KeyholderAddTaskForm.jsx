import React, { useState } from 'react';
import { FaPlusCircle } from 'react-icons/fa';

const KeyholderAddTaskForm = ({ onAddTask }) => {
  const [taskText, setTaskText] = useState('');
  const [rewardType, setRewardType] = useState('none'); // 'none', 'time', 'note'
  const [rewardValue, setRewardValue] = useState('');
  const [punishmentType, setPunishmentType] = useState('none'); // 'none', 'time', 'note'
  const [punishmentValue, setPunishmentValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!taskText.trim()) {
      alert('Please enter a task description.');
      return;
    }

    const taskData = {
      text: taskText.trim(),
      reward: {
        type: rewardType,
        value: rewardType === 'time' ? Number(rewardValue) * 3600 : rewardValue, // Store hours as seconds
      },
      punishment: {
        type: punishmentType,
        value: punishmentType === 'time' ? Number(punishmentValue) * 3600 : punishmentValue, // Store hours as seconds
      },
    };

    onAddTask(taskData);

    // Reset form
    setTaskText('');
    setRewardType('none');
    setRewardValue('');
    setPunishmentType('none');
    setPunishmentValue('');
  };

  return (
    <div className="tasks-container"> {/* Reusing styles from your index.css */}
      <h4 className="text-lg font-semibold mb-3 pb-2 border-b border-blue-800">Assign a New Task</h4>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Task Description */}
        <div>
          <label htmlFor="task-text" className="block text-xs font-medium mb-1">Task Description</label>
          <input
            id="task-text"
            type="text"
            value={taskText}
            onChange={(e) => setTaskText(e.target.value)}
            placeholder="e.g., Polish my boots"
            className="w-full"
            required
          />
        </div>

        {/* Reward Section */}
        <fieldset className="p-3 border border-blue-800 rounded-md">
          <legend className="px-2 text-sm font-semibold">Reward for Completion</legend>
          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <select value={rewardType} onChange={(e) => setRewardType(e.target.value)} className="flex-grow">
              <option value="none">No Reward</option>
              <option value="time">Reduce Chastity Time</option>
              <option value="note">Other (Custom Note)</option>
            </select>
            {rewardType === 'time' && (
              <input type="number" value={rewardValue} onChange={(e) => setRewardValue(e.target.value)} placeholder="Hours" className="w-full sm:w-24" />
            )}
            {rewardType === 'note' && (
              <input type="text" value={rewardValue} onChange={(e) => setRewardValue(e.target.value)} placeholder="Describe reward..." className="flex-grow" />
            )}
          </div>
        </fieldset>

        {/* Punishment Section */}
        <fieldset className="p-3 border border-blue-800 rounded-md">
          <legend className="px-2 text-sm font-semibold">Punishment for Failure</legend>
          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <select value={punishmentType} onChange={(e) => setPunishmentType(e.target.value)} className="flex-grow">
              <option value="none">No Punishment</option>
              <option value="time">Increase Chastity Time</option>
              <option value="note">Other (Custom Note)</option>
            </select>
            {punishmentType === 'time' && (
              <input type="number" value={punishmentValue} onChange={(e) => setPunishmentValue(e.target.value)} placeholder="Hours" className="w-full sm:w-24" />
            )}
            {punishmentType === 'note' && (
              <input type="text" value={punishmentValue} onChange={(e) => setPunishmentValue(e.target.value)} placeholder="Describe punishment..." className="flex-grow" />
            )}
          </div>
        </fieldset>

        <button type="submit" className="w-full flex items-center justify-center gap-2 font-bold py-2">
          <FaPlusCircle />
          Add Task
        </button>
      </form>
    </div>
  );
};

export default KeyholderAddTaskForm;