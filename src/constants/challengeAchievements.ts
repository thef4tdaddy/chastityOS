/**
 * Achievement definitions for special challenges
 * These can be integrated with the achievement system when it's fully implemented
 */

export const CHALLENGE_ACHIEVEMENTS = {
  locktober: {
    id: "locktober-complete",
    name: "Locktober Champion",
    description:
      "Successfully completed the entire month of October in chastity",
    category: "special_challenges" as const,
    difficulty: "epic" as const,
    points: 500,
    icon: "🔒",
    requirements: [
      {
        type: "goal_completion" as const,
        value: 1,
        condition: "challengeType === 'locktober'",
      },
    ],
    rarity: 15, // ~15% completion rate
  },
  noNutNovember: {
    id: "no-nut-november-complete",
    name: "No Nut November Victor",
    description:
      "Successfully abstained from orgasms for the entire month of November",
    category: "special_challenges" as const,
    difficulty: "epic" as const,
    points: 500,
    icon: "🚫",
    requirements: [
      {
        type: "goal_completion" as const,
        value: 1,
        condition: "challengeType === 'no_nut_november'",
      },
    ],
    rarity: 20, // ~20% completion rate
  },
  doubleChallenge: {
    id: "double-challenge-master",
    name: "Double Challenge Master",
    description:
      "Completed both Locktober and No Nut November in the same year",
    category: "special_achievements" as const,
    difficulty: "legendary" as const,
    points: 1000,
    icon: "👑",
    requirements: [
      {
        type: "goal_completion" as const,
        value: 2,
        condition:
          "isSpecialChallenge === true && challengeYear === currentYear",
      },
    ],
    rarity: 5, // ~5% completion rate
  },
} as const;

/**
 * Hook for achievement integration when the achievement system is ready
 */
export const useAchievementIntegration = () => {
  const checkForChallengeAchievements = async (completedGoal: {
    challengeType?: string;
    challengeYear?: number;
    isCompleted: boolean;
  }) => {
    if (!completedGoal.isCompleted || !completedGoal.challengeType) return;

    // This will be integrated with the actual achievement system
    console.log("Challenge completed - would trigger achievement:", {
      challengeType: completedGoal.challengeType,
      year: completedGoal.challengeYear,
      achievement:
        CHALLENGE_ACHIEVEMENTS[
          completedGoal.challengeType as keyof typeof CHALLENGE_ACHIEVEMENTS
        ],
    });

    // TODO: Integrate with actual achievement system
    // await achievementEngine.checkAndAwardAchievement(achievementId, userId);
  };

  return {
    checkForChallengeAchievements,
  };
};
