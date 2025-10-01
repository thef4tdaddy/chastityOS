/**
 * Goal Templates Hook
 * Handles template-based goal creation and suggestions
 */
import { useCallback } from "react";
import { serviceLogger } from "../../utils/logging";
import type {
  GoalTemplate,
  GoalSuggestion,
  GoalCustomization,
  SessionGoal,
  CreateGoalRequest,
  PredictiveGoalSuggestion,
  GoalAnalytics,
  GoalHistoryEntry,
} from "./types/SessionGoals";

const logger = serviceLogger("useGoalTemplates");

interface UseGoalTemplatesProps {
  goalTemplates: GoalTemplate[];
  goalHistory: GoalHistoryEntry[];
  setGoal: (goalRequest: CreateGoalRequest) => Promise<SessionGoal>;
}

export const useGoalTemplates = ({
  goalTemplates,
  goalHistory,
  setGoal,
}: UseGoalTemplatesProps) => {
  const getSuggestedGoals = useCallback((): GoalSuggestion[] => {
    try {
      const suggestions: GoalSuggestion[] = goalTemplates
        .filter((template) => template.isPopular)
        .map((template) => ({
          templateId: template.id,
          name: template.name,
          description: template.description,
          reasonForSuggestion: "Popular template for your experience level",
          confidence: 80,
          basedOn: "trending" as const,
        }));

      return suggestions;
    } catch (error) {
      logger.error("Failed to get suggested goals", { error });
      return [];
    }
  }, [goalTemplates]);

  const createGoalFromTemplate = useCallback(
    async (
      templateId: string,
      customizations?: GoalCustomization,
    ): Promise<SessionGoal> => {
      try {
        const template = goalTemplates.find((t) => t.id === templateId);
        if (!template) {
          throw new Error("Goal template not found");
        }

        const goalRequest: CreateGoalRequest = {
          type: "duration",
          category: template.category,
          target: customizations?.target
            ? { ...template.defaultTarget, ...customizations.target }
            : template.defaultTarget,
          priority: customizations?.priority || "medium",
          deadline: customizations?.deadline,
          description: customizations?.description || template.description,
          tags: customizations?.tags || template.tags,
        };

        return await setGoal(goalRequest);
      } catch (error) {
        logger.error("Failed to create goal from template", { error });
        throw error;
      }
    },
    [goalTemplates, setGoal],
  );

  const getGoalAnalytics = useCallback((): GoalAnalytics => {
    const completedGoals = goalHistory.filter((h) => h.action === "completed");
    const totalGoals = goalHistory.filter((h) => h.action === "created");

    return {
      completionRate:
        totalGoals.length > 0
          ? (completedGoals.length / totalGoals.length) * 100
          : 0,
      averageCompletionTime: 0,
      mostSuccessfulCategories: [],
      challengingCategories: [],
      streakData: {
        current: 0,
        best: 0,
        type: "daily_completion",
      },
      improvementTrends: [],
    };
  }, [goalHistory]);

  const getPredictiveGoals = useCallback((): PredictiveGoalSuggestion[] => {
    return [];
  }, []);

  return {
    getSuggestedGoals,
    createGoalFromTemplate,
    getGoalAnalytics,
    getPredictiveGoals,
  };
};
