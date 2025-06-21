import React from 'react';

// New helper function to format seconds into a clean, readable string.
// It finds the largest unit of time and formats it.
const formatDurationForDisplay = (totalSeconds) => {
  if (totalSeconds <= 0) return '';

  const days = Math.floor(totalSeconds / 86400);
  if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;

  const hours = Math.floor((totalSeconds % 86400) / 3600);
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;

  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  
  // Fallback for durations less than a minute
  return `${totalSeconds} second${totalSeconds > 1 ? 's' : ''}`;
};

const RewardsPunishmentsPage = ({ tasks = [] }) => {
  // Filter the tasks into separate arrays for rewards and punishments.
  const rewards = tasks.filter(task => task.type === 'reward');
  const punishments = tasks.filter(task => task.type === 'punishment');

  return (
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
                  {/* Updated display logic */}
                  {r.timeSeconds ? (
                    <span className="font-semibold">{formatDurationForDisplay(r.timeSeconds)} removed from time</span>
                  ) : null}
                  {r.other ? (r.timeSeconds ? `: ${r.other}` : r.other) : (r.text || '')}
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
                  {/* Updated display logic */}
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
