/**
 * Challenge utility functions for special challenges
 * (Locktober, No Nut November, etc.)
 */

import type { DBGoal } from "@/types/database";

export interface ChallengeAvailability {
  locktober: boolean;
  noNutNovember: boolean;
}

export interface ChallengeStatusData {
  locktober: {
    available: boolean;
    active: boolean;
    completed: boolean;
    goal?: DBGoal;
  };
  noNutNovember: {
    available: boolean;
    active: boolean;
    completed: boolean;
    goal?: DBGoal;
  };
}

/**
 * Check if challenges are available based on current date
 */
export const checkChallengeAvailability = (): ChallengeAvailability => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth(); // 0-based

  return {
    locktober: currentMonth === 9, // October
    noNutNovember: currentMonth === 10, // November
  };
};

/**
 * Build challenge status from goal data and availability
 */
export const buildChallengeStatus = (
  goals: DBGoal[],
  availability: ChallengeAvailability,
  currentYear: number,
): ChallengeStatusData => {
  // Find current year's goals
  const locktoberGoal = goals.find(
    (goal) =>
      goal.challengeType === "locktober" && goal.challengeYear === currentYear,
  );
  const noNutGoal = goals.find(
    (goal) =>
      goal.challengeType === "no_nut_november" &&
      goal.challengeYear === currentYear,
  );

  return {
    locktober: {
      available: availability.locktober,
      active: !!locktoberGoal && !locktoberGoal.isCompleted,
      completed: !!locktoberGoal?.isCompleted,
      goal: locktoberGoal,
    },
    noNutNovember: {
      available: availability.noNutNovember,
      active: !!noNutGoal && !noNutGoal.isCompleted,
      completed: !!noNutGoal?.isCompleted,
      goal: noNutGoal,
    },
  };
};

/**
 * Get progress percentage for a challenge
 */
export const getChallengeProgressPercentage = (goal?: DBGoal): number => {
  if (!goal) return 0;

  return Math.min(100, (goal.currentValue / goal.targetValue) * 100);
};

/**
 * Get challenge data by type
 */
export const getChallengeByType = (
  status: ChallengeStatusData,
  challengeType: "locktober" | "no_nut_november",
) => {
  const challengeMap = {
    locktober: status.locktober,
    no_nut_november: status.noNutNovember,
  };
  return challengeMap[challengeType as keyof typeof challengeMap];
};
