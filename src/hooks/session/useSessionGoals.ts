/**
 * Session Goals Management Hook
 * Provides comprehensive goal management with keyholder controls,
 * progress tracking, and achievement integration
 */
import { useGoalData } from "./useGoalData";
import { useGoalMutations } from "./useGoalMutations";
import { useGoalProgress } from "./useGoalProgress";
import { useGoalTemplates } from "./useGoalTemplates";
import { useKeyholderGoalManagement } from "./useKeyholderGoalManagement";
import { useGoalInitialization } from "./useGoalInitialization";
import { useGoalComputedValues } from "./useGoalComputedValues";

// ==================== INTERFACES ====================

export type * from "./types/SessionGoals";

// Complex goal management with templates, progress tracking, and achievements
export const useSessionGoals = (userId: string, relationshipId?: string) => {
  const goalData = useGoalData(userId, relationshipId);
  const {
    activeGoals,
    goalTemplates,
    progress,
    keyholderGoals,
    goalHistory,
    achievements,
    setActiveGoals,
    setProgress,
    setKeyholderGoals,
    setGoalHistory,
    setAchievements,
    loadActiveGoals,
    loadGoalTemplates,
    loadProgress,
    loadKeyholderGoals,
    loadGoalHistory,
    loadAchievements,
  } = goalData;

  const { setGoal, updateGoal, removeGoal } = useGoalMutations({
    setActiveGoals,
    setProgress,
    setGoalHistory,
    userId,
  });

  const { updateProgress, checkGoalCompletion, updateActiveGoalProgress } =
    useGoalProgress({
      activeGoals,
      progress,
      setProgress,
      setActiveGoals,
      setAchievements,
      updateGoal,
    });

  const { acceptKeyholderGoal, requestGoalModification } =
    useKeyholderGoalManagement({
      keyholderGoals,
      setActiveGoals,
      setKeyholderGoals,
      relationshipId,
    });

  const {
    getSuggestedGoals,
    createGoalFromTemplate,
    getGoalAnalytics,
    getPredictiveGoals,
  } = useGoalTemplates({
    goalTemplates,
    goalHistory,
    setGoal,
  });

  const { isLoading, error } = useGoalInitialization({
    userId,
    relationshipId,
    loadActiveGoals,
    loadGoalTemplates,
    loadProgress,
    loadKeyholderGoals,
    loadGoalHistory,
    loadAchievements,
    updateActiveGoalProgress,
  });

  const {
    totalActiveGoals,
    completionRate,
    hasRequiredGoals,
    goalDifficulty,
    estimatedCompletionTime,
  } = useGoalComputedValues({ activeGoals, progress });

  return {
    activeGoals,
    goalTemplates,
    progress,
    keyholderGoals,
    achievements,
    setGoal,
    updateGoal,
    removeGoal,
    updateProgress,
    checkGoalCompletion,
    acceptKeyholderGoal,
    requestGoalModification,
    getSuggestedGoals,
    createGoalFromTemplate,
    getGoalAnalytics,
    getPredictiveGoals,
    totalActiveGoals,
    completionRate,
    hasRequiredGoals,
    goalDifficulty,
    estimatedCompletionTime,
    isLoading,
    error,
  };
};

// ==================== HELPER FUNCTIONS ====================
