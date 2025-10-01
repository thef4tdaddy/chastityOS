/**
 * Session Goals Management Hook
 * Provides comprehensive goal management with keyholder controls,
 * progress tracking, and achievement integration
 */
import { serviceLogger } from "../../utils/logging";
import { useGoalData } from "./useGoalData";
import { useGoalMutations } from "./useGoalMutations";
import { useGoalProgress } from "./useGoalProgress";
import { useGoalTemplates } from "./useGoalTemplates";
import { useKeyholderGoalManagement } from "./useKeyholderGoalManagement";
import { useGoalInitialization } from "./useGoalInitialization";
import { useGoalComputedValues } from "./useGoalComputedValues";

const logger = serviceLogger("useSessionGoals");

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

  const mutations = useGoalMutations({
    setActiveGoals,
    setProgress,
    setGoalHistory,
    userId,
  });
  const { setGoal, updateGoal, removeGoal } = mutations;

  const progressTracking = useGoalProgress({
    activeGoals,
    progress,
    setProgress,
    setActiveGoals,
    setAchievements,
    updateGoal,
  });
  const { updateProgress, checkGoalCompletion, updateActiveGoalProgress } =
    progressTracking;

  const keyholderManagement = useKeyholderGoalManagement({
    keyholderGoals,
    setActiveGoals,
    setKeyholderGoals,
    relationshipId,
  });
  const { acceptKeyholderGoal, requestGoalModification } = keyholderManagement;

  const templates = useGoalTemplates({ goalTemplates, goalHistory, setGoal });
  const {
    getSuggestedGoals,
    createGoalFromTemplate,
    getGoalAnalytics,
    getPredictiveGoals,
  } = templates;

  const init = useGoalInitialization({
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
  const { isLoading, error } = init;

  const computed = useGoalComputedValues({ activeGoals, progress });
  const {
    totalActiveGoals,
    completionRate,
    hasRequiredGoals,
    goalDifficulty,
    estimatedCompletionTime,
  } = computed;

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
