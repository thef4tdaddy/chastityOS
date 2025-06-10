import React from 'react';
import { formatElapsedTime } from '../utils';

const RewardsPunishmentsPage = ({ rewards, punishments }) => {
  return (
    <div className="p-0 md:p-4 space-y-6">
      <div className="p-4 bg-gray-800 border border-purple-700 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-purple-300 mb-1">Tasks</h3>
        <p className="text-purple-400 text-sm">Keyholder tasks will appear here.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-gray-800 border border-green-700 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-green-300 mb-2">Rewards</h3>
          {rewards.length === 0 ? (
            <p className="text-purple-300 text-sm">No rewards added.</p>
          ) : (
            <ul className="text-purple-200 text-left list-disc list-inside space-y-1">
              {rewards.map(r => (
                <li key={r.id}>
                  {r.timeSeconds ? `- ${formatElapsedTime(r.timeSeconds)} ` : ''}{r.other}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="p-4 bg-gray-800 border border-red-700 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-red-300 mb-2">Punishments</h3>
          {punishments.length === 0 ? (
            <p className="text-purple-300 text-sm">No punishments added.</p>
          ) : (
            <ul className="text-purple-200 text-left list-disc list-inside space-y-1">
              {punishments.map(p => (
                <li key={p.id}>
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
