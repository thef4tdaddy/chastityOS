/**
 * Gamification Mutations Hook
 * Handles challenge acceptance/completion and experience management
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  PlayerProfile,
  Challenge,
  ExperienceSource,
  LevelResult,
  ChallengeCompletion,
  ExperienceEvent,
} from "../../types/gamification";
import { logger } from "../../utils/logging";
import { GamificationStorageService } from "../../services/gamificationStorage";
import { createBadgeFromReward } from "./gamification-utils";
import { addExperienceToProfile } from "./gamification-experience-utils";

interface UseGameificationMutationsParams {
  userId: string;
  playerProfile: PlayerProfile;
  activeChallenges: Challenge[];
  experienceHistory: ExperienceEvent[];
}

export const useGameificationMutations = ({
  userId,
  playerProfile,
  activeChallenges,
  experienceHistory,
}: UseGameificationMutationsParams) => {
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
      const levelResult = await addExperienceToProfile({
        amount: experienceGained,
        source: ExperienceSource.CHALLENGE_COMPLETE,
        playerProfile,
        experienceHistory,
        userId,
        queryClient,
      });

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
      return addExperienceToProfile({
        amount,
        source,
        playerProfile,
        experienceHistory,
        userId,
        queryClient,
      });
    },
  });

  return {
    acceptChallenge: acceptChallengeMutation.mutate,
    completeChallenge: completeChallengeMutation.mutate,
    addExperience: addExperienceMutation.mutate,
    isAcceptingChallenge: acceptChallengeMutation.isPending,
    isCompletingChallenge: completeChallengeMutation.isPending,
    isAddingExperience: addExperienceMutation.isPending,
    lastChallengeCompletion: completeChallengeMutation.data,
    lastLevelResult: addExperienceMutation.data,
    mutationError:
      acceptChallengeMutation.error ||
      completeChallengeMutation.error ||
      addExperienceMutation.error,
  };
};
