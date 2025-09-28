import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, collection, addDoc, updateDoc, deleteDoc, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import * as Sentry from '@sentry/react';

/**
 * Enhanced goal system with AI recommendations, collaborative goals, and comprehensive progress analytics
 * @param {string} userId - The user ID for goal management
 * @param {string} relationshipId - Optional relationship ID for collaborative goals
 * @param {boolean} isAuthReady - Whether authentication is ready
 * @returns {object} Enhanced goal state and management functions
 */
export const useGoals = (userId, relationshipId, isAuthReady) => {
  // Personal goals
  const [personalGoals, setPersonalGoals] = useState([]);
  
  // Collaborative goals
  const [collaborativeGoals, setCollaborativeGoals] = useState([]);
  
  // AI recommendations
  const [recommendedGoals, setRecommendedGoals] = useState([]);
  
  // Goal analytics
  const [goalAnalytics, setGoalAnalytics] = useState({
    completionRate: 0,
    averageCompletionTime: 0,
    totalGoalsCreated: 0,
    totalGoalsCompleted: 0,
    currentStreak: 0,
    longestStreak: 0,
    categoryBreakdown: {},
    difficultyBreakdown: {},
    monthlyProgress: []
  });
  
  // Goal templates
  const [goalTemplates] = useState([
    {
      id: 'chastity_milestone',
      category: 'chastity',
      title: 'Chastity Milestone Goal',
      description: 'Achieve a specific duration in chastity',
      template: {
        type: 'duration',
        target: { value: 30, unit: 'days' },
        difficulty: 'medium',
        milestones: [
          { at: 25, description: '25% complete' },
          { at: 50, description: 'Halfway there!' },
          { at: 75, description: 'Almost done!' },
          { at: 100, description: 'Goal achieved!' }
        ]
      }
    },
    {
      id: 'task_completion',
      category: 'tasks',
      title: 'Task Completion Goal',
      description: 'Complete a specific number of tasks',
      template: {
        type: 'count',
        target: { value: 10, unit: 'tasks' },
        difficulty: 'easy',
        milestones: [
          { at: 30, description: '3 tasks completed' },
          { at: 50, description: '5 tasks completed' },
          { at: 80, description: '8 tasks completed' },
          { at: 100, description: 'All tasks completed!' }
        ]
      }
    },
    {
      id: 'habit_building',
      category: 'habits',
      title: 'Daily Habit Goal',
      description: 'Build a consistent daily habit',
      template: {
        type: 'streak',
        target: { value: 21, unit: 'days' },
        difficulty: 'medium',
        milestones: [
          { at: 33, description: '7 days streak' },
          { at: 50, description: '10 days streak' },
          { at: 75, description: '15 days streak' },
          { at: 100, description: '21 days - habit formed!' }
        ]
      }
    },
    {
      id: 'improvement',
      category: 'personal_growth',
      title: 'Personal Improvement Goal',
      description: 'Work on personal development',
      template: {
        type: 'qualitative',
        target: { value: 1, unit: 'completion' },
        difficulty: 'hard',
        milestones: [
          { at: 25, description: 'Getting started' },
          { at: 50, description: 'Making progress' },
          { at: 75, description: 'Seeing results' },
          { at: 100, description: 'Goal achieved!' }
        ]
      }
    }
  ]);

  const [isLoading, setIsLoading] = useState(true);

  // Load goals from Firebase
  useEffect(() => {
    if (!isAuthReady || !userId) {
      setIsLoading(false);
      return;
    }

    const loadGoals = async () => {
      try {
        setIsLoading(true);
        
        // Load personal goals
        const goalsCollectionRef = collection(db, 'users', userId, 'goals');
        const personalGoalsQuery = query(
          goalsCollectionRef,
          where('type', '==', 'personal'),
          orderBy('createdAt', 'desc')
        );
        const personalSnapshot = await getDocs(personalGoalsQuery);
        const personalGoalsData = personalSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          estimatedCompletion: doc.data().estimatedCompletion?.toDate() || null,
          completedAt: doc.data().completedAt?.toDate() || null
        }));
        
        setPersonalGoals(personalGoalsData);
        
        // Load collaborative goals if relationshipId exists
        if (relationshipId) {
          const collaborativeQuery = query(
            goalsCollectionRef,
            where('type', '==', 'collaborative'),
            where('relationshipId', '==', relationshipId),
            orderBy('createdAt', 'desc')
          );
          const collaborativeSnapshot = await getDocs(collaborativeQuery);
          const collaborativeGoalsData = collaborativeSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            estimatedCompletion: doc.data().estimatedCompletion?.toDate() || null,
            completedAt: doc.data().completedAt?.toDate() || null
          }));
          
          setCollaborativeGoals(collaborativeGoalsData);
        }
        
        // Calculate analytics
        await calculateGoalAnalytics(personalGoalsData);
        
        // Generate AI recommendations
        await generateSmartRecommendations(personalGoalsData);
        
      } catch (error) {
        console.error('Error loading goals:', error);
        Sentry.captureException(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadGoals();
  }, [isAuthReady, userId, relationshipId]);

  // Calculate goal analytics
  const calculateGoalAnalytics = useCallback(async (goals = personalGoals) => {
    try {
      const completedGoals = goals.filter(goal => goal.progress?.status === 'completed');
      const totalGoals = goals.length;
      
      const completionRate = totalGoals > 0 ? (completedGoals.length / totalGoals) * 100 : 0;
      
      // Calculate average completion time
      const completionTimes = completedGoals
        .filter(goal => goal.createdAt && goal.completedAt)
        .map(goal => goal.completedAt.getTime() - goal.createdAt.getTime());
      
      const averageCompletionTime = completionTimes.length > 0 ?
        completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length : 0;
      
      // Calculate category breakdown
      const categoryBreakdown = goals.reduce((acc, goal) => {
        const category = goal.category || 'other';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {});
      
      // Calculate difficulty breakdown
      const difficultyBreakdown = goals.reduce((acc, goal) => {
        const difficulty = goal.difficulty || 'medium';
        acc[difficulty] = (acc[difficulty] || 0) + 1;
        return acc;
      }, {});
      
      // Calculate current streak (consecutive completed goals)
      let currentStreak = 0;
      const sortedGoals = [...goals].sort((a, b) => (b.completedAt || b.createdAt).getTime() - (a.completedAt || a.createdAt).getTime());
      
      for (const goal of sortedGoals) {
        if (goal.progress?.status === 'completed') {
          currentStreak++;
        } else {
          break;
        }
      }
      
      // Calculate longest streak
      let longestStreak = 0;
      let tempStreak = 0;
      
      for (const goal of sortedGoals.reverse()) {
        if (goal.progress?.status === 'completed') {
          tempStreak++;
          longestStreak = Math.max(longestStreak, tempStreak);
        } else {
          tempStreak = 0;
        }
      }
      
      // Calculate monthly progress
      const monthlyProgress = [];
      const now = new Date();
      
      for (let i = 11; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        
        const monthGoals = goals.filter(goal => {
          const goalDate = goal.completedAt || goal.createdAt;
          return goalDate >= month && goalDate < nextMonth;
        });
        
        const monthCompleted = monthGoals.filter(goal => goal.progress?.status === 'completed').length;
        
        monthlyProgress.push({
          month: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          total: monthGoals.length,
          completed: monthCompleted,
          completionRate: monthGoals.length > 0 ? (monthCompleted / monthGoals.length) * 100 : 0
        });
      }
      
      const analytics = {
        completionRate,
        averageCompletionTime,
        totalGoalsCreated: totalGoals,
        totalGoalsCompleted: completedGoals.length,
        currentStreak,
        longestStreak,
        categoryBreakdown,
        difficultyBreakdown,
        monthlyProgress
      };
      
      setGoalAnalytics(analytics);
      
    } catch (error) {
      console.error('Error calculating goal analytics:', error);
      Sentry.captureException(error);
    }
  }, [personalGoals]);

  // Generate smart recommendations based on user data
  const generateSmartRecommendations = useCallback(async (goals = personalGoals) => {
    try {
      const recommendations = [];
      
      // Analyze user patterns
      const completedGoals = goals.filter(goal => goal.progress?.status === 'completed');
      const preferredCategories = Object.entries(
        completedGoals.reduce((acc, goal) => {
          const category = goal.category || 'other';
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {})
      ).sort(([,a], [,b]) => b - a);
      
      const preferredDifficulty = completedGoals.length > 0 ?
        completedGoals.reduce((acc, goal) => {
          const difficulty = goal.difficulty || 'medium';
          acc[difficulty] = (acc[difficulty] || 0) + 1;
          return acc;
        }, {}) : { easy: 1, medium: 1, hard: 1 };
      
      // Recommend based on successful patterns
      if (preferredCategories.length > 0) {
        const topCategory = preferredCategories[0][0];
        const template = goalTemplates.find(t => t.category === topCategory);
        
        if (template) {
          recommendations.push({
            id: `rec-${Date.now()}-1`,
            type: 'pattern_based',
            confidence: 0.8,
            title: `Continue with ${template.title}`,
            description: `You've been successful with ${topCategory} goals. Here's another one!`,
            template: template,
            reason: `Based on your ${completedGoals.filter(g => g.category === topCategory).length} completed ${topCategory} goals`
          });
        }
      }
      
      // Recommend stepping up difficulty
      const mostCommonDifficulty = Object.entries(preferredDifficulty)
        .sort(([,a], [,b]) => b - a)[0]?.[0];
      
      if (mostCommonDifficulty === 'easy' && completedGoals.length >= 3) {
        recommendations.push({
          id: `rec-${Date.now()}-2`,
          type: 'progression',
          confidence: 0.7,
          title: 'Ready for a Challenge?',
          description: 'You\'ve mastered easy goals. Time to level up!',
          template: goalTemplates.find(t => t.template.difficulty === 'medium'),
          reason: 'You\'ve completed several easy goals successfully'
        });
      }
      
      // Recommend filling gaps
      const missingCategories = goalTemplates
        .map(t => t.category)
        .filter(category => !goals.some(goal => goal.category === category));
      
      if (missingCategories.length > 0) {
        const missingCategory = missingCategories[0];
        const template = goalTemplates.find(t => t.category === missingCategory);
        
        recommendations.push({
          id: `rec-${Date.now()}-3`,
          type: 'exploration',
          confidence: 0.6,
          title: `Explore ${template.title}`,
          description: `You haven't tried ${missingCategory} goals yet. Want to explore?`,
          template: template,
          reason: `New area to explore: ${missingCategory}`
        });
      }
      
      // Recommend streak building if user has never built one
      const hasStreakGoals = goals.some(goal => goal.type === 'streak');
      if (!hasStreakGoals && completedGoals.length >= 2) {
        recommendations.push({
          id: `rec-${Date.now()}-4`,
          type: 'habit_building',
          confidence: 0.75,
          title: 'Build a Habit Streak',
          description: 'Consistency is key. Try building a daily habit!',
          template: goalTemplates.find(t => t.template.type === 'streak'),
          reason: 'You\'re ready to build consistent habits'
        });
      }
      
      setRecommendedGoals(recommendations.slice(0, 5)); // Keep top 5 recommendations
      
    } catch (error) {
      console.error('Error generating recommendations:', error);
      Sentry.captureException(error);
    }
  }, [personalGoals, goalTemplates]);

  // Create a new goal
  const createGoal = useCallback(async (goalRequest) => {
    if (!isAuthReady || !userId) throw new Error('User not authenticated');
    
    try {
      const goalData = {
        ...goalRequest,
        createdBy: userId,
        createdAt: new Date(),
        estimatedCompletion: goalRequest.estimatedCompletion || null,
        progress: {
          status: 'active',
          current: 0,
          percentage: 0,
          lastUpdated: new Date()
        },
        aiGenerated: goalRequest.aiGenerated || false
      };
      
      const goalsCollectionRef = collection(db, 'users', userId, 'goals');
      const docRef = await addDoc(goalsCollectionRef, goalData);
      
      const newGoal = { id: docRef.id, ...goalData };
      
      if (goalData.type === 'personal') {
        setPersonalGoals(prev => [newGoal, ...prev]);
      } else if (goalData.type === 'collaborative') {
        setCollaborativeGoals(prev => [newGoal, ...prev]);
      }
      
      // Recalculate analytics
      await calculateGoalAnalytics([newGoal, ...personalGoals]);
      
      return newGoal;
      
    } catch (error) {
      console.error('Error creating goal:', error);
      Sentry.captureException(error);
      throw error;
    }
  }, [isAuthReady, userId, personalGoals, calculateGoalAnalytics]);

  // Update a goal
  const updateGoal = useCallback(async (goalId, updates) => {
    if (!isAuthReady || !userId) throw new Error('User not authenticated');
    
    try {
      const goalDocRef = doc(db, 'users', userId, 'goals', goalId);
      const updateData = {
        ...updates,
        lastUpdated: new Date()
      };
      
      await updateDoc(goalDocRef, updateData);
      
      // Update local state
      setPersonalGoals(prev => prev.map(goal => 
        goal.id === goalId ? { ...goal, ...updateData } : goal
      ));
      
      setCollaborativeGoals(prev => prev.map(goal => 
        goal.id === goalId ? { ...goal, ...updateData } : goal
      ));
      
    } catch (error) {
      console.error('Error updating goal:', error);
      Sentry.captureException(error);
      throw error;
    }
  }, [isAuthReady, userId]);

  // Delete a goal
  const deleteGoal = useCallback(async (goalId) => {
    if (!isAuthReady || !userId) throw new Error('User not authenticated');
    
    try {
      const goalDocRef = doc(db, 'users', userId, 'goals', goalId);
      await deleteDoc(goalDocRef);
      
      setPersonalGoals(prev => prev.filter(goal => goal.id !== goalId));
      setCollaborativeGoals(prev => prev.filter(goal => goal.id !== goalId));
      
    } catch (error) {
      console.error('Error deleting goal:', error);
      Sentry.captureException(error);
      throw error;
    }
  }, [isAuthReady, userId]);

  // Generate goal from AI prompt
  const generateGoalFromPrompt = useCallback(async (prompt) => {
    try {
      // In a real implementation, this would call an AI service
      // For now, we'll create a mock goal based on the prompt
      
      const promptLower = prompt.toLowerCase();
      let category = 'personal_growth';
      let difficulty = 'medium';
      let type = 'qualitative';
      
      if (promptLower.includes('chastity') || promptLower.includes('lock')) {
        category = 'chastity';
        type = 'duration';
      } else if (promptLower.includes('task') || promptLower.includes('assignment')) {
        category = 'tasks';
        type = 'count';
      } else if (promptLower.includes('habit') || promptLower.includes('daily')) {
        category = 'habits';
        type = 'streak';
      }
      
      if (promptLower.includes('easy') || promptLower.includes('simple')) {
        difficulty = 'easy';
      } else if (promptLower.includes('hard') || promptLower.includes('challenging')) {
        difficulty = 'hard';
      }
      
      const aiGoal = {
        type: 'personal',
        category,
        title: `AI Generated: ${prompt}`,
        description: `Goal generated from your prompt: "${prompt}"`,
        target: {
          value: type === 'duration' ? 7 : type === 'count' ? 5 : 1,
          unit: type === 'duration' ? 'days' : type === 'count' ? 'items' : 'completion'
        },
        difficulty,
        milestones: [
          { at: 25, description: 'Getting started' },
          { at: 50, description: 'Halfway there' },
          { at: 75, description: 'Almost done' },
          { at: 100, description: 'Goal achieved!' }
        ],
        aiGenerated: true,
        estimatedCompletion: new Date(Date.now() + (difficulty === 'easy' ? 7 : difficulty === 'medium' ? 14 : 30) * 24 * 60 * 60 * 1000)
      };
      
      return aiGoal;
      
    } catch (error) {
      console.error('Error generating goal from prompt:', error);
      Sentry.captureException(error);
      throw error;
    }
  }, []);

  // Optimize goal plan
  const optimizeGoalPlan = useCallback(async (goalIds) => {
    try {
      const goals = personalGoals.filter(goal => goalIds.includes(goal.id));
      
      // Simple optimization: prioritize by difficulty and dependencies
      const optimizedPlan = {
        recommendedOrder: goals.sort((a, b) => {
          const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
          return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
        }),
        estimatedCompletionTime: goals.reduce((total, goal) => {
          const difficultyMultiplier = { easy: 1, medium: 1.5, hard: 2 };
          return total + (7 * difficultyMultiplier[goal.difficulty]); // Base 7 days per goal
        }, 0),
        suggestions: [
          'Start with easier goals to build momentum',
          'Set daily check-ins for habit-based goals',
          'Break larger goals into smaller milestones'
        ]
      };
      
      return optimizedPlan;
      
    } catch (error) {
      console.error('Error optimizing goal plan:', error);
      Sentry.captureException(error);
      throw error;
    }
  }, [personalGoals]);

  // Share a goal
  const shareGoal = useCallback(async (goalId, targetUserId) => {
    try {
      // Implementation would create a share/invite record
      console.log(`Sharing goal ${goalId} with user ${targetUserId}`);
    } catch (error) {
      console.error('Error sharing goal:', error);
      throw error;
    }
  }, []);

  // Invite collaborator
  const inviteCollaborator = useCallback(async (goalId, targetUserId) => {
    try {
      // Implementation would create collaboration invite
      const invite = {
        id: `invite-${Date.now()}`,
        goalId,
        fromUserId: userId,
        toUserId: targetUserId,
        status: 'pending',
        createdAt: new Date()
      };
      
      return invite;
    } catch (error) {
      console.error('Error inviting collaborator:', error);
      throw error;
    }
  }, [userId]);

  // Accept collaboration
  const acceptCollaboration = useCallback(async (inviteId) => {
    try {
      // Implementation would accept collaboration invite
      console.log(`Accepting collaboration invite ${inviteId}`);
    } catch (error) {
      console.error('Error accepting collaboration:', error);
      throw error;
    }
  }, []);

  // Get goal insights
  const getGoalInsights = useCallback(() => {
    const insights = {
      mostSuccessfulCategory: Object.entries(goalAnalytics.categoryBreakdown)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'none',
      averageGoalsPerMonth: goalAnalytics.monthlyProgress.reduce((sum, month) => sum + month.total, 0) / 12,
      improvementTrend: goalAnalytics.monthlyProgress.slice(-3).every((month, i, arr) => 
        i === 0 || month.completionRate >= arr[i-1].completionRate
      ),
      recommendedFocus: goalAnalytics.completionRate < 50 ? 'quality' : 'quantity'
    };
    
    return insights;
  }, [goalAnalytics]);

  // Get predictive analytics
  const getPredictiveAnalytics = useCallback(() => {
    const predictions = {
      likelyCompletionDate: new Date(Date.now() + goalAnalytics.averageCompletionTime),
      successProbability: Math.min(goalAnalytics.completionRate / 100 * 1.2, 1),
      recommendedGoalCount: Math.max(1, Math.floor(goalAnalytics.completionRate / 25)),
      riskFactors: goalAnalytics.currentStreak === 0 ? ['Low recent activity'] : []
    };
    
    return predictions;
  }, [goalAnalytics]);

  // Get completion trends
  const getCompletionTrends = useCallback(() => {
    return {
      monthly: goalAnalytics.monthlyProgress,
      overall: {
        trend: goalAnalytics.currentStreak > goalAnalytics.longestStreak / 2 ? 'improving' : 'stable',
        momentum: goalAnalytics.currentStreak
      }
    };
  }, [goalAnalytics]);

  // Computed values
  const activeGoalsCount = personalGoals.filter(g => g.progress?.status === 'active').length;
  const completionRate = goalAnalytics.completionRate;
  const averageCompletionTime = goalAnalytics.averageCompletionTime;
  const hasCollaborativeGoals = collaborativeGoals.length > 0;
  const needsAttention = personalGoals.filter(g => g.progress?.status === 'behind').length;

  return {
    // Goal state
    personalGoals,
    collaborativeGoals,
    recommendedGoals,
    goalAnalytics,
    goalTemplates,
    isLoading,
    
    // Goal management
    createGoal,
    updateGoal,
    deleteGoal,
    
    // AI features
    getSmartRecommendations: generateSmartRecommendations,
    generateGoalFromPrompt,
    optimizeGoalPlan,
    
    // Collaboration
    shareGoal,
    inviteCollaborator,
    acceptCollaboration,
    
    // Analytics
    getGoalInsights,
    getPredictiveAnalytics,
    getCompletionTrends,
    
    // Computed values
    activeGoalsCount,
    completionRate,
    averageCompletionTime,
    hasCollaborativeGoals,
    needsAttention
  };
};