/**
 * Gamification Analytics Hook
 * Handles level up checks, leaderboard rankings, and friend comparisons
 */
import { useCallback } from "react";
import {
  PlayerProfile,
  Leaderboard,
  SocialGameFeatures,
  LevelUpResult,
  LeaderboardRank,
  FriendComparison,
} from "../../types/gamification";
import { LEVEL_THRESHOLDS } from "../../constants/gamification";
import {
  generateLevelRewards,
  getPlayerTitle,
  getUnlockedFeatures,
} from "./gamification-utils";

interface UseGameificationAnalyticsParams {
  playerProfile: PlayerProfile;
  leaderboards: Leaderboard[];
  socialFeatures?: SocialGameFeatures;
}

export const useGameificationAnalytics = ({
  playerProfile,
  leaderboards,
  socialFeatures,
}: UseGameificationAnalyticsParams) => {
  // Check level up
  const checkLevelUp = useCallback(async (): Promise<LevelUpResult | null> => {
    const _currentLevelThreshold =
      LEVEL_THRESHOLDS[playerProfile.level - 1] || 0;
    const nextLevelThreshold =
      LEVEL_THRESHOLDS[playerProfile.level] || Infinity;

    if (playerProfile.experience >= nextLevelThreshold) {
      const newLevel = playerProfile.level + 1;
      const rewards = generateLevelRewards(newLevel);

      return {
        newLevel,
        rewards,
        newTitle: getPlayerTitle(newLevel),
        unlockedFeatures: getUnlockedFeatures(newLevel),
      };
    }

    return null;
  }, [playerProfile]);

  // Get leaderboard rank
  const getLeaderboardRank = useCallback(
    async (leaderboardId: string): Promise<LeaderboardRank> => {
      const leaderboard = leaderboards.find((l) => l.id === leaderboardId);
      if (!leaderboard) throw new Error("Leaderboard not found");

      // Find user's rank (simulated)
      const userRank =
        Math.floor(Math.random() * leaderboard.totalParticipants) + 1;
      const percentile =
        ((leaderboard.totalParticipants - userRank) /
          leaderboard.totalParticipants) *
        100;

      return {
        category: leaderboard.category,
        period: leaderboard.period,
        rank: userRank,
        totalParticipants: leaderboard.totalParticipants,
        percentile,
        value: playerProfile.stats.totalExperience,
      };
    },
    [leaderboards, playerProfile],
  );

  // Compare with friends
  const compareWithFriends = useCallback(async (): Promise<
    FriendComparison[]
  > => {
    if (!socialFeatures?.friends) return [];

    return socialFeatures.friends.map((friend) => ({
      friendId: friend.userId,
      friendName: friend.displayName,
      categories: [
        {
          category: "Level",
          playerValue: playerProfile.level,
          friendValue: friend.level,
          difference: playerProfile.level - friend.level,
          status:
            playerProfile.level > friend.level
              ? "ahead"
              : playerProfile.level < friend.level
                ? "behind"
                : "tied",
        },
        {
          category: "Experience",
          playerValue: playerProfile.experience,
          friendValue: Math.floor(Math.random() * 10000),
          difference: 0,
          status: "tied",
        },
      ],
      overallComparison: "ahead",
    }));
  }, [socialFeatures, playerProfile]);

  return {
    checkLevelUp,
    getLeaderboardRank,
    compareWithFriends,
  };
};
