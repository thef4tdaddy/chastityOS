/**
 * Gamification Experience Utilities
 * Helper functions for experience calculation and level progression
 */

import { QueryClient } from "@tanstack/react-query";
import {
  PlayerProfile,
  ExperienceSource,
  LevelResult,
  ExperienceEvent,
} from "../../types/gamification";
import { logger } from "../../utils/logging";
import { GamificationStorageService } from "../../services/gamificationStorage";
import { LEVEL_THRESHOLDS } from "../../constants/gamification";

interface AddExperienceParams {
  amount: number;
  source: ExperienceSource;
  playerProfile: PlayerProfile;
  experienceHistory: ExperienceEvent[];
  userId: string;
  queryClient: QueryClient;
}

/**
 * Add experience to player profile and update level
 */
export const addExperienceToProfile = async ({
  amount,
  source,
  playerProfile,
  experienceHistory,
  userId,
  queryClient,
}: AddExperienceParams): Promise<LevelResult> => {
  const oldLevel = playerProfile.level;
  const newExperience = playerProfile.experience + amount;

  // Calculate new level
  let newLevel = oldLevel;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (newExperience >= LEVEL_THRESHOLDS[i]) {
      newLevel = i + 1;
    } else {
      break;
    }
  }

  const experienceToNext =
    newLevel < LEVEL_THRESHOLDS.length
      ? LEVEL_THRESHOLDS[newLevel] - newExperience
      : 0;

  // Create experience event
  const experienceEvent: ExperienceEvent = {
    id: `exp-${Date.now()}`,
    source,
    amount,
    description: `Gained ${amount} XP from ${source}`,
    timestamp: new Date(),
  };

  // Update experience history
  const updatedHistory = [experienceEvent, ...experienceHistory].slice(0, 100);
  GamificationStorageService.setExperienceHistory(updatedHistory);
  queryClient.setQueryData(
    ["gamification", "experience", userId],
    updatedHistory,
  );

  // Update profile
  const updatedProfile = {
    ...playerProfile,
    level: newLevel,
    experience: newExperience,
    experienceToNext,
    stats: {
      ...playerProfile.stats,
      totalExperience: playerProfile.stats.totalExperience + amount,
    },
    lastActive: new Date(),
  };

  GamificationStorageService.setPlayerProfile(updatedProfile);
  queryClient.setQueryData(["gamification", "profile", userId], updatedProfile);

  logger.info("Experience added", {
    amount,
    source,
    oldLevel,
    newLevel,
    userId,
  });

  return {
    leveledUp: newLevel > oldLevel,
    oldLevel,
    newLevel,
    experience: amount,
  };
};
