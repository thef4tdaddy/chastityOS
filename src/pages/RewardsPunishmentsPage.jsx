import React from 'react';
import { useAuth } from '../hooks/useAuth';
// Note: Assuming a hook that provides rewards/punishments data.
// This is a placeholder for your actual data fetching logic.
const useRewardsPunishments = () => ({
  rewards: [],
  punishments: [],
  addReward: () => console.log('Add Reward'),
  addPunishment: () => console.log('Add Punishment'),
});


const RewardsPunishmentsPage = () => {
  // FIX: Removed unused 'user' variable. The useAuth hook is still called to ensure
  // the user is authenticated, but we don't need to store the user object itself here.
  useAuth();
  const { rewards, punishments, addReward, addPunishment } = useRewardsPunishments();

  const hasRewards = rewards && rewards.length > 0;
  const hasPunishments = punishments && punishments.length > 0;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Rewards & Punishments</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Rewards Section */}
        <div>
          <h2 className="text-xl font-semibold mb-3">Rewards</h2>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            {hasRewards ? (
              <ul>
                {rewards.map((reward, index) => (
                  <li key={index} className="border-b border-gray-200 dark:border-gray-700 py-2">
                    {reward.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No rewards set up yet.</p>
            )}
            <button
              onClick={() => addReward({ name: 'New Reward' })}
              className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              Add Reward
            </button>
          </div>
        </div>

        {/* Punishments Section */}
        <div>
          <h2 className="text-xl font-semibold mb-3">Punishments</h2>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            {hasPunishments ? (
              <ul>
                {punishments.map((punishment, index) => (
                  <li key={index} className="border-b border-gray-200 dark:border-gray-700 py-2">
                    {punishment.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No punishments set up yet.</p>
            )}
            <button
              onClick={() => addPunishment({ name: 'New Punishment' })}
              className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              Add Punishment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RewardsPunishmentsPage;
