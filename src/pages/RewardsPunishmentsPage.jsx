import React from 'react';
import { formatElapsedTime } from '../utils';

// This component now receives the 'tasks' array from props.
const RewardsPunishmentsPage = ({ tasks = [] }) => {
  // This debugging line will show what data the component receives in your browser's console.
  console.log('Tasks received by RewardsPunishmentsPage:', tasks);

  // Filter the tasks into separate arrays for rewards and punishments.
  const rewards = tasks.filter(task => task.type === 'reward');
  const punishments = tasks.filter(task => task.type === 'punishment');

  return (
    // The top "Tasks" section has been removed.
    <div className="p-0 md:p-4 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="reward-box p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-2 title-yellow">Rewards History</h3>
          {rewards.length === 0 ? (
            <p className="text-sm text-yellow-300">No rewards have been given.</p>
          ) : (
            <ul className="text-left list-disc list-inside space-y-1">
              {rewards.map(r => (
                <li key={r.id} className="text-yellow-300">
                  {r.timeSeconds ? <span className="font-semibold">-{formatElapsedTime(r.timeSeconds)}</span> : ''}
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
              {punishments.map(p => (
                <li key={p.id} className="text-red-300">
                  {p.timeSeconds ? <span className="font-semibold">+{formatElapsedTime(p.timeSeconds)}</span> : ''}
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
