import React from 'react';
import { formatElapsedTime } from '../utils';

const RewardsPunishmentsPage = ({ rewards, punishments }) => {
  return (
    <div className="settings-container p-0 md:p-4 space-y-6">
      <div className="task-box p-4 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-1 title-blue">Tasks</h3>
        <p className="text-sm text-blue-300">Keyholder tasks will appear here.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="reward-box p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-2 title-yellow">Rewards</h3>
          {rewards.length === 0 ? (
            <p className="text-sm text-yellow-300">No rewards added.</p>
          ) : (
            <ul className="text-left list-disc list-inside space-y-1">
              {rewards.map(r => (
                <li key={r.id} className="text-yellow-300">
                  {r.timeSeconds ? `- ${formatElapsedTime(r.timeSeconds)} ` : ''}{r.other}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="punishment-box p-4 rounded-lg shadow-sm">
         <h3 className="text-lg font-semibold mb-2 title-red">Punishments</h3>
          {punishments.length === 0 ? (
            <p className="text-sm text-red-300">No punishments added.</p>
          ) : (
            <ul className="text-left list-disc list-inside space-y-1">
              {punishments.map(p => (
                <li key={p.id} className="text-red-300">
                  {p.timeSeconds ? `+ ${formatElapsedTime(p.timeSeconds)} ` : ''}{p.other}
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
