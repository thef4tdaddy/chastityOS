import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import * as Sentry from '@sentry/react';

/**
 * Enhanced gamification system with challenges, leaderboards, seasons, and social features
 * @param {string} userId - The user ID for gamification features
 * @param {boolean} isAuthReady - Whether authentication is ready
 * @returns {object} Gamification state and management functions
 */
export const useGameification = (userId, isAuthReady) => {
  // Player profile state
  const [playerProfile, setPlayerProfile] = useState({
    level: 1,
    experience: 0,
    experienceToNext: 100,
    title: { id: 'newcomer', name: 'Newcomer', description: 'Just starting the journey' },
    badges: [],
    stats: {
      sessionsCompleted: 0,
      totalTimeInChastity: 0,
      challengesCompleted: 0,
      achievementsUnlocked: 0,
      longestSession: 0,
      currentStreak: 0,
      bestStreak: 0
    },
    preferences: {
      publicProfile: false,
      showOnLeaderboard: true,
      allowChallenges: true,
      notifications: true
    }
  });

  // Active challenges
  const [activeChallenges, setActiveChallenges] = useState([]);
  
  // Available challenges
  const [availableChallenges] = useState([
    {
      id: 'first_week',
      type: 'duration',
      name: 'First Week',
      description: 'Complete your first 7-day chastity session',
      difficulty: 'easy',
      requirements: [{ type: 'continuous_session', value: 7, unit: 'days' }],
      rewards: [{ type: 'experience', value: 100 }, { type: 'badge', id: 'first_week' }],
      startDate: null,
      endDate: null,
      timeLimit: null
    },
    {
      id: 'monthly_warrior',
      type: 'duration',
      name: 'Monthly Warrior',
      description: 'Complete a 30-day continuous session',
      difficulty: 'hard',
      requirements: [{ type: 'continuous_session', value: 30, unit: 'days' }],
      rewards: [{ type: 'experience', value: 500 }, { type: 'badge', id: 'monthly_warrior' }],
      startDate: null,
      endDate: null,
      timeLimit: null
    },
    {
      id: 'task_master',
      type: 'activity',
      name: 'Task Master',
      description: 'Complete 10 keyholder tasks in a week',
      difficulty: 'medium',
      requirements: [{ type: 'tasks_completed', value: 10, timeframe: 7 }],
      rewards: [{ type: 'experience', value: 200 }, { type: 'badge', id: 'task_master' }],
      startDate: null,
      endDate: null,
      timeLimit: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    },
    {
      id: 'social_butterfly',
      type: 'social',
      name: 'Social Butterfly',
      description: 'Send 5 challenge invites to friends',
      difficulty: 'easy',
      requirements: [{ type: 'challenges_sent', value: 5 }],
      rewards: [{ type: 'experience', value: 150 }, { type: 'badge', id: 'social_butterfly' }],
      startDate: null,
      endDate: null,
      timeLimit: null
    }
  ]);

  // Leaderboards
  const [leaderboards, setLeaderboards] = useState([]);
  
  // Current season
  const [currentSeason, setCurrentSeason] = useState(null);
  
  // Social features
  const [socialFeatures, setSocialFeatures] = useState({
    friends: [],
    challengeInvites: [],
    comparisons: [],
    achievements: []
  });

  const [isLoading, setIsLoading] = useState(true);

  // Experience calculation helper
  const calculateExperienceToNext = useCallback((level) => {
    return Math.floor(100 * Math.pow(1.2, level - 1));
  }, []);

  // Calculate level from total experience
  const calculateLevelFromExperience = useCallback((totalExp) => {
    let level = 1;
    let expRequired = 100;
    let expSoFar = 0;

    while (totalExp >= expSoFar + expRequired) {
      expSoFar += expRequired;
      level++;
      expRequired = calculateExperienceToNext(level);
    }

    return {
      level,
      experience: totalExp - expSoFar,
      experienceToNext: expRequired,
      totalExperience: totalExp
    };
  }, [calculateExperienceToNext]);

  // Load gamification data from Firebase
  useEffect(() => {
    if (!isAuthReady || !userId) {
      setIsLoading(false);
      return;
    }

    const loadGameificationData = async () => {
      try {
        setIsLoading(true);
        const userDocRef = doc(db, 'users', userId);
        const docSnap = await getDoc(userDocRef);
        
        if (docSnap.exists() && docSnap.data().gamificationData) {
          const gamificationData = docSnap.data().gamificationData;
          
          if (gamificationData.playerProfile) {
            setPlayerProfile(prev => ({ ...prev, ...gamificationData.playerProfile }));
          }
          
          if (gamificationData.activeChallenges) {
            setActiveChallenges(gamificationData.activeChallenges);
          }
          
          if (gamificationData.socialFeatures) {
            setSocialFeatures(prev => ({ ...prev, ...gamificationData.socialFeatures }));
          }
        } else {
          // Initialize gamification data for new users
          await initializeGamificationData();
        }
        
        // Load current season
        await loadCurrentSeason();
        
        // Load leaderboards
        await loadLeaderboards();
        
      } catch (error) {
        console.error('Error loading gamification data:', error);
        Sentry.captureException(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadGameificationData();
  }, [isAuthReady, userId]);

  // Initialize gamification data for new users
  const initializeGamificationData = useCallback(async () => {
    const initialData = {
      playerProfile,
      activeChallenges: [],
      socialFeatures: {
        friends: [],
        challengeInvites: [],
        comparisons: [],
        achievements: []
      },
      createdAt: new Date().toISOString()
    };

    await saveGameificationData(initialData);
  }, [playerProfile]);

  // Save gamification data to Firebase
  const saveGameificationData = useCallback(async (data) => {
    if (!isAuthReady || !userId) return;
    
    try {
      const userDocRef = doc(db, 'users', userId);
      await setDoc(userDocRef, { gamificationData: data }, { merge: true });
    } catch (error) {
      console.error('Error saving gamification data:', error);
      Sentry.captureException(error);
    }
  }, [isAuthReady, userId]);

  // Load current season
  const loadCurrentSeason = useCallback(async () => {
    try {
      // In a real implementation, this would load from a seasons collection
      // For now, we'll create a mock current season
      const now = new Date();
      const seasonStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const seasonEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      setCurrentSeason({
        id: `season-${now.getFullYear()}-${now.getMonth() + 1}`,
        name: `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`,
        description: 'Monthly season challenges and rewards',
        startDate: seasonStart,
        endDate: seasonEnd,
        rewards: [
          { id: 'seasonal_badge', name: 'Seasonal Champion', requirement: 'Top 10%' },
          { id: 'experience_boost', name: '50% XP Boost', requirement: 'Complete season challenge' }
        ],
        challenge: {
          id: 'monthly_focus',
          name: 'Monthly Focus Challenge',
          description: 'Maintain chastity for the entire month',
          requirement: 'No unlocks during the season'
        }
      });
    } catch (error) {
      console.error('Error loading current season:', error);
    }
  }, []);

  // Load leaderboards
  const loadLeaderboards = useCallback(async () => {
    try {
      // In a real implementation, this would load from a global leaderboards collection
      // For now, we'll create mock leaderboards
      setLeaderboards([
        {
          id: 'experience',
          name: 'Experience Leaders',
          description: 'Top players by total experience',
          type: 'global',
          period: 'all_time',
          entries: [] // Would be populated from database
        },
        {
          id: 'monthly',
          name: 'Monthly Champions',
          description: 'Top performers this month',
          type: 'seasonal',
          period: 'current_month',
          entries: []
        },
        {
          id: 'streaks',
          name: 'Streak Masters',
          description: 'Longest current streaks',
          type: 'global',
          period: 'current',
          entries: []
        }
      ]);
    } catch (error) {
      console.error('Error loading leaderboards:', error);
    }
  }, []);

  // Accept a challenge
  const acceptChallenge = useCallback(async (challengeId) => {
    const challenge = availableChallenges.find(c => c.id === challengeId);
    if (!challenge) {
      throw new Error('Challenge not found');
    }

    const activeChallenge = {
      ...challenge,
      acceptedAt: new Date(),
      progress: {
        completed: false,
        current: 0,
        requirements: challenge.requirements.map(req => ({ ...req, current: 0, completed: false }))
      },
      isCompleted: false
    };

    const newActiveChallenges = [...activeChallenges, activeChallenge];
    setActiveChallenges(newActiveChallenges);

    await saveGameificationData({
      playerProfile,
      activeChallenges: newActiveChallenges,
      socialFeatures
    });
  }, [availableChallenges, activeChallenges, playerProfile, socialFeatures, saveGameificationData]);

  // Complete a challenge
  const completeChallenge = useCallback(async (challengeId) => {
    const challengeIndex = activeChallenges.findIndex(c => c.id === challengeId);
    if (challengeIndex === -1) {
      throw new Error('Active challenge not found');
    }

    const challenge = activeChallenges[challengeIndex];
    const rewards = challenge.rewards || [];
    
    let experienceGained = 0;
    const badgesEarned = [];

    // Process rewards
    for (const reward of rewards) {
      if (reward.type === 'experience') {
        experienceGained += reward.value;
      } else if (reward.type === 'badge') {
        badgesEarned.push({
          id: reward.id,
          name: reward.name || challenge.name,
          description: `Earned by completing: ${challenge.description}`,
          earnedAt: new Date(),
          rarity: challenge.difficulty
        });
      }
    }

    // Update player profile
    const totalExperience = playerProfile.stats.achievementsUnlocked * 50 + experienceGained; // Simplified calculation
    const levelInfo = calculateLevelFromExperience(totalExperience);
    
    const updatedProfile = {
      ...playerProfile,
      ...levelInfo,
      badges: [...playerProfile.badges, ...badgesEarned],
      stats: {
        ...playerProfile.stats,
        challengesCompleted: playerProfile.stats.challengesCompleted + 1,
        achievementsUnlocked: playerProfile.stats.achievementsUnlocked + 1
      }
    };

    // Remove completed challenge from active challenges
    const updatedActiveChallenges = activeChallenges.filter((_, index) => index !== challengeIndex);

    setPlayerProfile(updatedProfile);
    setActiveChallenges(updatedActiveChallenges);

    await saveGameificationData({
      playerProfile: updatedProfile,
      activeChallenges: updatedActiveChallenges,
      socialFeatures
    });

    return {
      experienceGained,
      badgesEarned,
      levelUp: levelInfo.level > playerProfile.level,
      newLevel: levelInfo.level
    };
  }, [activeChallenges, playerProfile, socialFeatures, calculateLevelFromExperience, saveGameificationData]);

  // Get challenge progress
  const getChallengeProgress = useCallback((challengeId) => {
    const challenge = activeChallenges.find(c => c.id === challengeId);
    return challenge ? challenge.progress : null;
  }, [activeChallenges]);

  // Add experience
  const addExperience = useCallback(async (amount, source) => {
    const totalExperience = (playerProfile.stats.achievementsUnlocked * 50) + amount;
    const levelInfo = calculateLevelFromExperience(totalExperience);
    
    const updatedProfile = {
      ...playerProfile,
      ...levelInfo,
      stats: {
        ...playerProfile.stats,
        // Update stats based on source
        ...(source === 'session_completed' && { sessionsCompleted: playerProfile.stats.sessionsCompleted + 1 }),
        ...(source === 'task_completed' && { achievementsUnlocked: playerProfile.stats.achievementsUnlocked + 1 })
      }
    };

    setPlayerProfile(updatedProfile);

    await saveGameificationData({
      playerProfile: updatedProfile,
      activeChallenges,
      socialFeatures
    });

    return {
      previousLevel: playerProfile.level,
      newLevel: levelInfo.level,
      levelUp: levelInfo.level > playerProfile.level,
      experienceGained: amount
    };
  }, [playerProfile, activeChallenges, socialFeatures, calculateLevelFromExperience, saveGameificationData]);

  // Check for level up
  const checkLevelUp = useCallback(async () => {
    const totalExperience = playerProfile.stats.achievementsUnlocked * 50;
    const levelInfo = calculateLevelFromExperience(totalExperience);
    
    if (levelInfo.level > playerProfile.level) {
      const updatedProfile = { ...playerProfile, ...levelInfo };
      setPlayerProfile(updatedProfile);
      
      await saveGameificationData({
        playerProfile: updatedProfile,
        activeChallenges,
        socialFeatures
      });

      return {
        previousLevel: playerProfile.level,
        newLevel: levelInfo.level,
        rewards: [] // Could include level-up rewards
      };
    }
    
    return null;
  }, [playerProfile, activeChallenges, socialFeatures, calculateLevelFromExperience, saveGameificationData]);

  // Get leaderboard rank (mock implementation)
  const getLeaderboardRank = useCallback(async (leaderboardId) => {
    // In a real implementation, this would query the leaderboard collection
    return {
      rank: Math.floor(Math.random() * 100) + 1,
      score: playerProfile.experience,
      totalParticipants: 1000
    };
  }, [playerProfile.experience]);

  // Join leaderboard
  const joinLeaderboard = useCallback(async (leaderboardId) => {
    // Implementation would update user's leaderboard participation
    console.log(`Joining leaderboard: ${leaderboardId}`);
  }, []);

  // Leave leaderboard
  const leaveLeaderboard = useCallback(async (leaderboardId) => {
    // Implementation would remove user from leaderboard
    console.log(`Leaving leaderboard: ${leaderboardId}`);
  }, []);

  // Compare with friends (mock implementation)
  const compareWithFriends = useCallback(async () => {
    // In a real implementation, this would load friends' data
    return [
      {
        userId: 'friend1',
        name: 'Friend 1',
        level: playerProfile.level + 1,
        experience: playerProfile.experience + 150,
        rank: 'Higher'
      },
      {
        userId: 'friend2', 
        name: 'Friend 2',
        level: playerProfile.level - 1,
        experience: playerProfile.experience - 200,
        rank: 'Lower'
      }
    ];
  }, [playerProfile.level, playerProfile.experience]);

  // Send challenge to friend
  const sendChallenge = useCallback(async (friendId, challengeId) => {
    // Implementation would send challenge invite to friend
    console.log(`Sending challenge ${challengeId} to friend ${friendId}`);
  }, []);

  // Get seasonal rewards
  const getSeasonalRewards = useCallback(async () => {
    if (!currentSeason) return [];
    
    return currentSeason.rewards || [];
  }, [currentSeason]);

  // Claim seasonal reward
  const claimSeasonalReward = useCallback(async (rewardId) => {
    // Implementation would claim and apply seasonal reward
    console.log(`Claiming seasonal reward: ${rewardId}`);
  }, []);

  // Helper functions for computed values
  const getCompletedChallengesCount = useCallback((days) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    // In a real implementation, this would check completion dates
    return Math.floor(Math.random() * 5); // Mock value
  }, []);

  const getCurrentRank = useCallback((leaderboards) => {
    if (leaderboards.length === 0) return null;
    
    // Mock rank calculation
    return Math.floor(Math.random() * 100) + 1;
  }, []);

  const checkUnclaimedRewards = useCallback(() => {
    // Check for unclaimed seasonal rewards or achievement rewards
    return false; // Mock value
  }, []);

  // Computed values
  const currentLevel = playerProfile.level;
  const progressToNext = playerProfile.experienceToNext > 0 ? 
    (playerProfile.experience / playerProfile.experienceToNext) * 100 : 100;
  const activeChallengeCount = activeChallenges.length;
  const completedChallengesThisWeek = getCompletedChallengesCount(7);
  const rank = getCurrentRank(leaderboards);
  const hasUnclaimedRewards = checkUnclaimedRewards();

  return {
    // Player state
    playerProfile,
    activeChallenges,
    availableChallenges,
    leaderboards,
    currentSeason,
    socialFeatures,
    isLoading,
    
    // Challenge management
    acceptChallenge,
    completeChallenge,
    getChallengeProgress,
    
    // Experience and leveling
    addExperience,
    checkLevelUp,
    
    // Leaderboard features
    getLeaderboardRank,
    joinLeaderboard,
    leaveLeaderboard,
    
    // Social features
    compareWithFriends,
    sendChallenge,
    
    // Seasonal events
    getSeasonalRewards,
    claimSeasonalReward,
    
    // Computed values
    currentLevel,
    progressToNext,
    activeChallengeCount,
    completedChallengesThisWeek,
    rank,
    hasUnclaimedRewards
  };
};