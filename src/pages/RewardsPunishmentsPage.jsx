// src/pages/RewardsPunishmentsPage.jsx
import React from 'react';
import { FaAward, FaExclamationTriangle } from 'react-icons/fa';

// Helper function to format seconds into a readable string.
const formatDurationForDisplay = (totalSeconds) => {
  if (totalSeconds <= 0) return '';
  const days = Math.floor(totalSeconds / 86400);
  if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  return `${totalSeconds} second${totalSeconds > 1 ? 's' : ''}`;
};

const RewardsPunishmentsPage = ({ tasks = [] }) => {
  const rewards = tasks.filter(task => task.type === 'reward');
  const punishments = tasks.filter(task => task.type === 'punishment');

  return (
    <div className="p-0 md:p-4 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Rewards Box - Uses classes from index.css */}
        <div className="box box-yellow rewards-history-box">
          <h4><FaAward className="mr-2" />Rewards History</h4>
          {rewards.length === 0 ? (
            <p>No rewards have been given.</p>
          ) : (
            <ul>
              {rewards.map(r => (
                <li key={r.id}>
                  {r.timeSeconds ? (
                    <span className="font-semibold">{formatDurationForDisplay(r.timeSeconds)} removed from time</span>
                  ) : null}
                  {r.other ? (r.timeSeconds ? `: ${r.other}` : r.other) : (r.text || '')}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Punishment Box - Uses classes from index.css */}
        <div className="box box-red punishments-history-box">
          <h4><FaExclamationTriangle className="mr-2" />Punishments History</h4>
          {punishments.length === 0 ? (
            <p>No punishments have been given.</p>
          ) : (
            <ul>
              {punishments.map(p => (
                <li key={p.id}>
                  {p.timeSeconds ? (
                    <span className="font-semibold">{formatDurationForDisplay(p.timeSeconds)} added to time</span>
                  ) : null}
                  {p.other ? (p.timeSeconds ? `: ${p.other}` : p.other) : (p.text || '')}
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