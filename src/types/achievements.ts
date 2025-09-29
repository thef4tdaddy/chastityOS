/**
 * Achievement System Types
 * Defines the structure for achievements, badges, and leaderboards
 */

import { Timestamp } from "firebase/firestore";

// ==================== ACHIEVEMENT TYPES ====================

export enum AchievementCategory {
  SESSION_MILESTONES = "session_milestones",
  CONSISTENCY_BADGES = "consistency_badges",
  STREAK_ACHIEVEMENTS = "streak_achievements",
  GOAL_BASED = "goal_based",
  TASK_COMPLETION = "task_completion",
  SPECIAL_ACHIEVEMENTS = "special_achievements",
}

export enum AchievementDifficulty {
  COMMON = "common",
  UNCOMMON = "uncommon",
  RARE = "rare",
  EPIC = "epic",
  LEGENDARY = "legendary",
}

export interface AchievementRequirement {
  type:
    | "session_duration"
    | "session_count"
    | "streak_days"
    | "goal_completion"
    | "task_completion"
    | "special_condition";
  value: number;
  unit?: "seconds" | "days" | "count";
  condition?: string; // For special conditions like "before 8 AM" or "on weekend"
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  icon: string; // Emoji or icon identifier
  difficulty: AchievementDifficulty;
  points: number;
  requirements: AchievementRequirement[];
  isHidden: boolean; // Hidden achievements for discovery
  rarity?: number; // Percentage of users who have earned this (0-100)
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  earnedAt: Timestamp;
  progress: number; // For tracking partial progress (0-100)
  metadata?: Record<string, unknown>; // Additional context data
  isVisible: boolean; // User can choose to hide achievements
}

export interface AchievementProgress {
  userId: string;
  achievementId: string;
  currentValue: number;
  targetValue: number;
  lastUpdated: Timestamp;
  isCompleted: boolean;
}

// ==================== LEADERBOARD TYPES ====================

export enum LeaderboardCategory {
  TOTAL_CHASTITY_TIME = "total_chastity_time",
  LONGEST_SINGLE_SESSION = "longest_single_session",
  CURRENT_STREAK = "current_streak",
  ACHIEVEMENT_POINTS = "achievement_points",
  SESSION_COUNT = "session_count",
  GOAL_ACHIEVEMENTS = "goal_achievements",
  // Additional categories referenced in components
  TOTAL_POINTS = "total_points",
  ACHIEVEMENTS_EARNED = "achievements_earned",
  LONGEST_STREAK = "longest_streak",
  TOTAL_TIME = "total_time",
}

export enum LeaderboardPeriod {
  THIS_WEEK = "this_week",
  THIS_MONTH = "this_month",
  THIS_YEAR = "this_year",
  ALL_TIME = "all_time",
}

export interface LeaderboardEntry {
  id: string;
  userId: string;
  displayName: string;
  category: LeaderboardCategory;
  period: LeaderboardPeriod;
  value: number;
  rank: number;
  lastUpdated: Timestamp;
  isAnonymous: boolean;
}

export interface LeaderboardPrivacy {
  participateInGlobal: boolean;
  participateInMonthly: boolean;
  shareSessionTime: boolean;
  shareStreakData: boolean;
  shareAchievements: boolean;
  displayName: "real" | "username" | "anonymous";
  showOnPublicProfile: boolean;
}

// ==================== NOTIFICATION TYPES ====================

export interface AchievementNotification {
  id: string;
  userId: string;
  achievementId: string;
  type: "earned" | "progress" | "milestone";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Timestamp;
}

// ==================== STATS TYPES ====================

export interface AchievementStats {
  totalAchievements: number;
  totalPoints: number;
  completionPercentage: number; // Percentage of all achievements earned
  categoryCounts: Record<AchievementCategory, number>;
  difficultyBreakdown: Record<AchievementDifficulty, number>;
  lastEarned?: {
    achievement: Achievement;
    earnedAt: Timestamp;
  };
}

// ==================== EXPORT TYPES ====================

export interface AchievementExportData {
  achievements: UserAchievement[];
  progress: AchievementProgress[];
  stats: AchievementStats;
  notifications: AchievementNotification[];
  exportedAt: Timestamp;
}
