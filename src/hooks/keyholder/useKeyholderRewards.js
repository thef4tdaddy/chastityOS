import { useState, useCallback, useEffect } from 'react';
import { collection, addDoc, query, onSnapshot, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

/**
 * @typedef {Object} Reward
 * @property {string} [id]
 * @property {'time_reduction'|'privilege'|'custom'} type
 * @property {string} description
 * @property {number} [timeReductionSeconds]
 * @property {Date} [createdAt]
 * @property {string} assignedBy
 */

/**
 * @typedef {Object} RewardOptions
 * @property {string|null} userId
 * @property {boolean} isAuthReady
 * @property {string} [keyholderEmail]
 */

/**
 * Hook for managing keyholder rewards
 * @param {RewardOptions} options
 * @returns {Object}
 */
export const useKeyholderRewards = ({ userId, isAuthReady, keyholderEmail }) => {
  const [rewards, setRewards] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const addReward = useCallback(async (rewardData) => {
    if (!userId || !isAuthReady) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const rewardsCollection = collection(db, 'users', userId, 'rewards');
      await addDoc(rewardsCollection, {
        ...rewardData,
        createdAt: serverTimestamp(),
        assignedBy: keyholderEmail || 'Unknown Keyholder'
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add reward');
    } finally {
      setIsLoading(false);
    }
  }, [userId, isAuthReady, keyholderEmail]);

  const fetchRewards = useCallback(() => {
    if (!userId || !isAuthReady) {
      return;
    }

    setIsLoading(true);
    const rewardsCollection = collection(db, 'users', userId, 'rewards');
    const q = query(rewardsCollection, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q,
      (querySnapshot) => {
        const rewardsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate()
        }));
        
        setRewards(rewardsList);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, [userId, isAuthReady]);

  useEffect(() => {
    const unsubscribe = fetchRewards();
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [fetchRewards]);

  const getTotalTimeReduction = useCallback(() => {
    return rewards
      .filter(reward => reward.type === 'time_reduction' && reward.timeReductionSeconds)
      .reduce((total, reward) => total + (reward.timeReductionSeconds || 0), 0);
  }, [rewards]);

  return {
    rewards,
    isLoading,
    error,
    addReward,
    getTotalTimeReduction
  };
};