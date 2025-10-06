/**
 * Gamification mutations hook
 * Separates mutation logic from main useGameification hook
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Challenge,
  PlayerProfile,
  ChallengeCompletion,
  ExperienceSource,
  LevelResult,
} from "../../types/gamification";
import { logger } from "../../utils/logging";
import { GamificationStorageService } from "../../services/gamificationStorage";
import { createBadgeFromReward } from "@/utils/gamification";

export function useGamificationMutations(
  userId: string,
  activeChallenges: Challenge[],
  playerProfile: PlayerProfile,
  addExperienceInternal: (
    amount: number,
    source: ExperienceSource,
  ) => Promise<LevelResult>,
) {
  const queryClient = useQueryClient();

  // Accept challenge mutation
  const acceptChallengeMutation = useMutation({
    mutationFn: async (challengeId: string) => {
      const challenge = activeChallenges.find((c) => c.id === challengeId);
      if (!challenge) throw new Error("Challenge not found");

      logger.info("Challenge accepted", { challengeId, userId });

      // In a real implementation, this would register the user for the challenge
      await new Promise((resolve) => setTimeout(resolve, 500));
    },
  });

  // Complete challenge mutation
  const completeChallengeMutation = useMutation({
    mutationFn: async (challengeId: string): Promise<ChallengeCompletion> => {
      const challenge = activeChallenges.find((c) => c.id === challengeId);
      if (!challenge) throw new Error("Challenge not found");

      logger.info("Challenge completed", { challengeId, userId });

      // Mark challenge as completed
      const updatedChallenges = activeChallenges.map((c) =>
        c.id === challengeId
          ? {
              ...c,
              isCompleted: true,
              progress: { ...c.progress, percentage: 100 },
            }
          : c,
      );
      GamificationStorageService.setChallenges(updatedChallenges);

      // Calculate rewards
      const experienceGained = challenge.rewards.reduce(
        (total, reward) =>
          reward.type === "experience" ? total + reward.value : total,
        0,
      );

      // Add experience
      const levelResult = await addExperienceInternal(
        experienceGained,
        ExperienceSource.CHALLENGE_COMPLETE,
      );

      // Create completion result
      const completion: ChallengeCompletion = {
        challengeId,
        completedAt: new Date(),
        rewards: challenge.rewards,
        experience: experienceGained,
        newBadges: challenge.rewards
          .filter((r) => r.type === "badge")
          .map((r) => createBadgeFromReward(r)),
        levelUp: levelResult.leveledUp
          ? {
              newLevel: levelResult.newLevel,
              rewards: [],
              unlockedFeatures: [],
            }
          : undefined,
      };

      // Update stats
      const updatedProfile = {
        ...playerProfile,
        stats: {
          ...playerProfile.stats,
          challengesCompleted: playerProfile.stats.challengesCompleted + 1,
          totalExperience:
            playerProfile.stats.totalExperience + experienceGained,
        },
      };
      GamificationStorageService.setPlayerProfile(updatedProfile);
      queryClient.setQueryData(
        ["gamification", "profile", userId],
        updatedProfile,
      );

      return completion;
    },
  });

  // Add experience mutation
  const addExperienceMutation = useMutation({
    mutationFn: async ({
      amount,
      source,
    }: {
      amount: number;
      source: ExperienceSource;
    }): Promise<LevelResult> => {
      return addExperienceInternal(amount, source);
    },
  });

  return {
    acceptChallengeMutation,
    completeChallengeMutation,
    addExperienceMutation,
  };
}
