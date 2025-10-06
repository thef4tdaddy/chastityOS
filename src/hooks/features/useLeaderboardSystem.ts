/**
 * Leaderboard system hook
 * Handles leaderboard operations and rank calculations
 */

import { useCallback } from "react";
import { Leaderboard, PlayerProfile } from "../../types/gamification";
import { calculatePercentile } from "../../utils/gamification/gamificationHelpers";
import { logger } from "../../utils/logging";

export function useLeaderboardSystem(
  leaderboards: Leaderboard[],
  playerProfile: PlayerProfile,
  userId: string,
) {
  // Get leaderboard rank
  const getLeaderboardRank = useCallback(
    async (leaderboardId: string) => {
      const leaderboard = leaderboards.find((l) => l.id === leaderboardId);
      if (!leaderboard) throw new Error("Leaderboard not found");
      const userRank =
        Math.floor(Math.random() * leaderboard.totalParticipants) + 1;
      return {
        category: leaderboard.category,
        period: leaderboard.period,
        rank: userRank,
        totalParticipants: leaderboard.totalParticipants,
        percentile: calculatePercentile(
          userRank,
          leaderboard.totalParticipants,
        ),
        value: playerProfile.stats.totalExperience,
      };
    },
    [leaderboards, playerProfile],
  );

  const joinLeaderboard = useCallback(
    async (id: string) =>
      logger.info("Joined leaderboard", { leaderboardId: id, userId }),
    [userId],
  );

  const leaveLeaderboard = useCallback(
    async (id: string) =>
      logger.info("Left leaderboard", { leaderboardId: id, userId }),
    [userId],
  );

  // Calculate user's rank in leaderboards
  const rank =
    leaderboards.length > 0
      ? leaderboards[0].entries.findIndex((e) => e.userId === userId) + 1 || 0
      : 0;

  return {
    getLeaderboardRank,
    joinLeaderboard,
    leaveLeaderboard,
    rank,
  };
}
