import { useCallback } from 'react';
import { useTheme } from './ui/useTheme';
import { useOfflineStatus } from './system/useOfflineStatus';
import { usePerformance } from './system/usePerformance';
import { useHealthCheck } from './system/useHealthCheck';
import { useMigration } from './system/useMigration';
import { useGameification } from './features/useGameification';
import { useGoals } from './features/useGoals';
import { useReporting } from './features/useReporting';

/**
 * Integration hook that combines all advanced features for easy usage
 * @param {object} config - Configuration object
 * @param {string} config.userId - User ID
 * @param {string} config.relationshipId - Relationship ID (optional)
 * @param {boolean} config.isAuthReady - Authentication ready state
 * @returns {object} Combined advanced features state and functions
 */
export const useAdvancedFeatures = ({ userId, relationshipId, isAuthReady }) => {
  // UI hooks
  const theme = useTheme(userId, isAuthReady);
  
  // System hooks
  const offlineStatus = useOfflineStatus();
  const performance = usePerformance();
  const healthCheck = useHealthCheck();
  const migration = useMigration(userId, isAuthReady);
  
  // Feature hooks
  const gamification = useGameification(userId, isAuthReady);
  const goals = useGoals(userId, relationshipId, isAuthReady);
  const reporting = useReporting(userId, relationshipId, isAuthReady);

  // Combined system status
  const getSystemStatus = useCallback(() => {
    return {
      online: offlineStatus.isOnline,
      performance: {
        score: performance.performanceScore,
        hasWarnings: performance.hasWarnings
      },
      health: {
        overall: healthCheck.overallHealth,
        score: healthCheck.healthScore
      },
      migration: {
        required: migration.isMigrationRequired,
        inProgress: migration.isMigrationInProgress
      }
    };
  }, [offlineStatus.isOnline, performance.performanceScore, performance.hasWarnings, 
      healthCheck.overallHealth, healthCheck.healthScore, migration.isMigrationRequired, migration.isMigrationInProgress]);

  // Combined user progress
  const getUserProgress = useCallback(() => {
    return {
      level: gamification.currentLevel,
      experience: gamification.playerProfile.experience,
      activeGoals: goals.activeGoalsCount,
      completionRate: goals.completionRate,
      recentReports: reporting.totalReports
    };
  }, [gamification.currentLevel, gamification.playerProfile.experience, 
      goals.activeGoalsCount, goals.completionRate, reporting.totalReports]);

  // Unified notification system
  const getNotifications = useCallback(() => {
    const notifications = [];
    
    // System notifications
    if (!offlineStatus.isOnline) {
      notifications.push({
        type: 'system',
        level: 'warning',
        message: 'You are currently offline',
        actions: ['retry_connection']
      });
    }
    
    if (performance.hasWarnings) {
      notifications.push({
        type: 'system',
        level: 'info',
        message: `Performance issues detected (Score: ${performance.performanceScore})`,
        actions: ['view_details', 'optimize']
      });
    }
    
    if (healthCheck.hasActiveAlerts) {
      notifications.push({
        type: 'system',
        level: 'error',
        message: 'System health alerts require attention',
        actions: ['view_alerts', 'acknowledge']
      });
    }
    
    if (migration.isMigrationRequired) {
      notifications.push({
        type: 'system',
        level: 'info',
        message: 'Data migration available',
        actions: ['start_migration', 'learn_more']
      });
    }
    
    // Feature notifications
    if (gamification.hasUnclaimedRewards) {
      notifications.push({
        type: 'gamification',
        level: 'success',
        message: 'You have unclaimed rewards!',
        actions: ['claim_rewards']
      });
    }
    
    if (goals.needsAttention > 0) {
      notifications.push({
        type: 'goals',
        level: 'warning',
        message: `${goals.needsAttention} goals need attention`,
        actions: ['view_goals']
      });
    }
    
    return notifications;
  }, [offlineStatus.isOnline, performance.hasWarnings, performance.performanceScore,
      healthCheck.hasActiveAlerts, migration.isMigrationRequired, 
      gamification.hasUnclaimedRewards, goals.needsAttention]);

  // Quick actions
  const quickActions = {
    // Theme actions
    toggleTheme: () => {
      const newThemeId = theme.isDarkMode ? 'light' : 'default';
      theme.setTheme(newThemeId);
    },
    
    // System actions
    runHealthCheck: healthCheck.performHealthCheck,
    startMigration: () => migration.runMigration(),
    clearPerformanceWarnings: performance.clearWarnings,
    
    // Feature actions
    generateQuickReport: () => reporting.generateReport('chastity_summary', { dateRange: 'last7days' }),
    acceptRandomChallenge: () => {
      const availableChallenges = gamification.availableChallenges.filter(
        c => !gamification.activeChallenges.find(ac => ac.id === c.id)
      );
      if (availableChallenges.length > 0) {
        const randomChallenge = availableChallenges[Math.floor(Math.random() * availableChallenges.length)];
        return gamification.acceptChallenge(randomChallenge.id);
      }
    },
    
    createGoalFromRecommendation: () => {
      if (goals.recommendedGoals.length > 0) {
        const topRecommendation = goals.recommendedGoals[0];
        return goals.createGoal({
          ...topRecommendation.template.template,
          title: topRecommendation.title,
          description: topRecommendation.description,
          type: 'personal',
          aiGenerated: true
        });
      }
    }
  };

  return {
    // Individual hook states
    theme,
    offlineStatus,
    performance,
    healthCheck,
    migration,
    gamification,
    goals,
    reporting,
    
    // Combined utilities
    getSystemStatus,
    getUserProgress,
    getNotifications,
    quickActions,
    
    // Overall loading state
    isLoading: theme.isLoading || gamification.isLoading || goals.isLoading || reporting.isLoading,
    
    // Overall ready state
    isReady: isAuthReady && !theme.isLoading && !gamification.isLoading && !goals.isLoading && !reporting.isLoading
  };
};