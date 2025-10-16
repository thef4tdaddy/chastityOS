/**
 * Helper functions for gamification operations
 */

import {
  PlayerProfile,
  ExperienceSource,
  ExperienceEvent,
  LevelResult,
} from "../../types/gamification";
import { LEVEL_THRESHOLDS } from "../../constants/gamification";

/**
 * Calculate new level based on experience
 */
export function calculateLevel(experience: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    const threshold = LEVEL_THRESHOLDS[i];
    if (threshold !== undefined && experience >= threshold) {
      level = i + 1;
    } else {
      break;
    }
  }
  return level;
}

/**
 * Calculate experience needed for next level
 */
export function calculateExperienceToNext(
  experience: number,
  level: number,
): number {
  const threshold = LEVEL_THRESHOLDS[level];
  return level < LEVEL_THRESHOLDS.length && threshold !== undefined
    ? threshold - experience
    : 0;
}

/**
 * Create an experience event
 */
export function createExperienceEvent(
  amount: number,
  source: ExperienceSource,
): ExperienceEvent {
  return {
    id: `exp-${Date.now()}`,
    source,
    amount,
    description: `Gained ${amount} XP from ${source}`,
    timestamp: new Date(),
  };
}

/**
 * Update experience history with a new event
 */
export function updateExperienceHistory(
  history: ExperienceEvent[],
  newEvent: ExperienceEvent,
  maxLength: number = 100,
): ExperienceEvent[] {
  return [newEvent, ...history].slice(0, maxLength);
}

/**
 * Update player profile with new experience and level
 */
export function updatePlayerProfileWithExperience(
  profile: PlayerProfile,
  experienceAdded: number,
  newLevel: number,
  newExperience: number,
  experienceToNext: number,
): PlayerProfile {
  return {
    ...profile,
    level: newLevel,
    experience: newExperience,
    experienceToNext,
    stats: {
      ...profile.stats,
      totalExperience: profile.stats.totalExperience + experienceAdded,
    },
    lastActive: new Date(),
  };
}

/**
 * Calculate level result from experience gain
 */
export function calculateLevelResult(
  oldLevel: number,
  newLevel: number,
  experienceAmount: number,
): LevelResult {
  return {
    leveledUp: newLevel > oldLevel,
    oldLevel,
    newLevel,
    experience: experienceAmount,
  };
}

/**
 * Calculate progress to next level as percentage
 */
export function calculateProgressToNext(
  currentLevel: number,
  currentExperience: number,
  experienceToNext: number,
): number {
  if (experienceToNext <= 0) return 100;

  const currentLevelThreshold = LEVEL_THRESHOLDS[currentLevel - 1] || 0;
  const nextLevelThreshold = LEVEL_THRESHOLDS[currentLevel] || experienceToNext;

  return (
    ((currentExperience - currentLevelThreshold) /
      (nextLevelThreshold - currentLevelThreshold)) *
    100
  );
}

/**
 * Calculate user's percentile rank in a leaderboard
 */
export function calculatePercentile(
  userRank: number,
  totalParticipants: number,
): number {
  return ((totalParticipants - userRank) / totalParticipants) * 100;
}
