import React from 'react';
import { formatElapsedTime } from '../utils';

// This component now receives the 'tasks' array from props.
const RewardsPunishmentsPage = ({ tasks = [] }) => {
  // Filter the tasks into separate arrays for rewards and punishments.
  const rewards = tasks.filter(task => task.type === 'reward');
  const punishments = tasks.filter(task => task.type === 'punishment');

  return (
    <div className="settings-container p-0 md:p-4 space-y-6">
      <div className="task-box p-4 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-1 title-blue">Tasks</h3>
        <p className="text-sm text-blue-300">This page shows the history of time-based rewards and punishments. Other keyholder tasks will appear on the main Tasks page.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="reward-box p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-2 title-yellow">Rewards History</h3>
          {rewards.length === 0 ? (
            <p className="text-sm text-yellow-300">No rewards have been given.</p>
          ) : (
            <ul className="text-left list-disc list-inside space-y-1">
              {/* Maps over the filtered rewards array */}
              {rewards.map(r => (
                <li key={r.id} className="text-yellow-300">
                  {/* Displays the time subtraction if it exists */}
                  {r.timeSeconds ? <span className="font-semibold">-{formatElapsedTime(r.timeSeconds)}</span> : ''}
                  {/* Displays the note/reason */}
                  {r.other ? `: ${r.other}` : (r.text || '')}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="punishment-box p-4 rounded-lg shadow-sm">
         <h3 className="text-lg font-semibold mb-2 title-red">Punishments History</h3>
          {punishments.length === 0 ? (
            <p className="text-sm text-red-300">No punishments have been given.</p>
          ) : (
            <ul className="text-left list-disc list-inside space-y-1">
              {/* Maps over the filtered punishments array */}
              {punishments.map(p => (
                <li key={p.id} className="text-red-300">
                  {/* Displays the time addition if it exists */}
                  {p.timeSeconds ? <span className="font-semibold">+{formatElapsedTime(p.timeSeconds)}</span> : ''}
                  {/* Displays the note/reason */}
                  {p.other ? `: ${p.other}` : (p.text || '')}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default RewardsPunishmentsPage;
