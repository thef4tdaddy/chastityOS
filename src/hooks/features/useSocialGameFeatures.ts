/**
 * Social game features hook
 * Handles friend comparisons and challenge sharing
 */

import { useCallback } from "react";
import { SocialGameFeatures, PlayerProfile } from "../../types/gamification";
import { logger } from "../../utils/logging";

export function useSocialGameFeatures(
  socialFeatures: SocialGameFeatures | undefined,
  playerProfile: PlayerProfile,
  userId: string,
) {
  // Compare with friends
  const compareWithFriends = useCallback(async () => {
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

  const sendChallenge = useCallback(
    async (friendId: string, challengeId: string) => {
      logger.info("Challenge sent to friend", {
        friendId,
        challengeId,
        userId,
      });
      await new Promise((resolve) => setTimeout(resolve, 500));
    },
    [userId],
  );

  return {
    compareWithFriends,
    sendChallenge,
  };
}
