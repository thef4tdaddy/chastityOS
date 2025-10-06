/**
 * Seasonal rewards hook
 * Handles seasonal reward operations
 */

import { useCallback } from "react";
import { Season } from "../../types/gamification";
import { logger } from "../../utils/logging";

export function useSeasonalRewards(
  currentSeason: Season | null | undefined,
  userId: string,
) {
  const getSeasonalRewards = useCallback(
    async () => currentSeason?.rewards || [],
    [currentSeason],
  );

  const claimSeasonalReward = useCallback(
    async (rewardId: string) => {
      logger.info("Seasonal reward claimed", { rewardId, userId });
      await new Promise((resolve) => setTimeout(resolve, 500));
    },
    [userId],
  );

  const hasUnclaimedRewards =
    currentSeason?.rewards.some((r) => !r.claimed) || false;

  return {
    getSeasonalRewards,
    claimSeasonalReward,
    hasUnclaimedRewards,
  };
}
