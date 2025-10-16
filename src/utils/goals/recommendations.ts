/**
 * Goal recommendations helper functions
 */

import {
  EnhancedGoal,
  CollaborativeGoal,
  GoalRecommendation,
  GoalType,
  GoalCategory,
  GoalDifficulty,
  GoalStatus,
} from "../../types/goals";

export function generateSmartRecommendations(
  personal: EnhancedGoal[],
  _collaborative: CollaborativeGoal[],
): GoalRecommendation[] {
  const recommendations: GoalRecommendation[] = [];

  // Analyze completed goals to suggest similar ones
  const completedGoals = personal.filter(
    (g) => g.progress.status === GoalStatus.COMPLETED,
  );
  const activeCategories = new Set(personal.map((g) => g.category));

  // Suggest goals in successful categories
  completedGoals.forEach((goal) => {
    if (Math.random() > 0.7) {
      recommendations.push({
        id: `rec-${Date.now()}-${Math.random()}`,
        type: goal.type,
        category: goal.category,
        title: `Advanced ${goal.category} Challenge`,
        description: `Based on your success with "${goal.title}"`,
        difficulty:
          goal.difficulty === GoalDifficulty.EASY
            ? GoalDifficulty.MEDIUM
            : GoalDifficulty.HARD,
        estimatedDuration: 30,
        reasoning: `You successfully completed similar goals in the ${goal.category} category`,
        confidence: 0.8,
        similarGoals: [goal.id],
        successRate: 0.75,
      });
    }
  });

  // Suggest unexplored categories
  const allCategories = Object.values(GoalCategory);
  const unexploredCategories = allCategories.filter(
    (cat) => !activeCategories.has(cat),
  );

  unexploredCategories.forEach((category) => {
    if (Math.random() > 0.8) {
      recommendations.push({
        id: `exp-${Date.now()}-${Math.random()}`,
        type: GoalType.MILESTONE,
        category,
        title: `Explore ${category}`,
        description: `Try something new in the ${category} category`,
        difficulty: GoalDifficulty.EASY,
        estimatedDuration: 14,
        reasoning: `Diversifying goal categories can improve overall success`,
        confidence: 0.6,
        similarGoals: [],
        successRate: 0.65,
      });
    }
  });

  return recommendations.slice(0, 5);
}
