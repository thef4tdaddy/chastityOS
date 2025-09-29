/**
 * Gamification System Types
 */

// Experience sources
export enum ExperienceSource {
  SESSION_COMPLETE = 'session_complete',
  CHALLENGE_COMPLETE = 'challenge_complete',
  MILESTONE_REACHED = 'milestone_reached',
  BEHAVIOR_IMPROVEMENT = 'behavior_improvement',
  DAILY_CHECK_IN = 'daily_check_in',
  SOCIAL_INTERACTION = 'social_interaction',
  GOAL_ACHIEVEMENT = 'goal_achievement'
}

// Challenge types
export enum ChallengeType {
  DURATION = 'duration',
  FREQUENCY = 'frequency',
  BEHAVIORAL = 'behavioral',
  SOCIAL = 'social',
  CREATIVE = 'creative',
  EDUCATIONAL = 'educational'
}

// Challenge difficulty
export enum ChallengeDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
  LEGENDARY = 'legendary'
}

// Player titles
export enum PlayerTitle {
  NOVICE = 'novice',
  APPRENTICE = 'apprentice',
  PRACTITIONER = 'practitioner',
  ADEPT = 'adept',
  EXPERT = 'expert',
  MASTER = 'master',
  GRANDMASTER = 'grandmaster',
  LEGEND = 'legend'
}

// Badge categories
export enum BadgeCategory {
  DURATION = 'duration',
  DEDICATION = 'dedication',
  ACHIEVEMENT = 'achievement',
  SOCIAL = 'social',
  SPECIAL = 'special',
  SEASONAL = 'seasonal'
}

// Leaderboard categories
export enum LeaderboardCategory {
  EXPERIENCE = 'experience',
  DURATION = 'duration',
  CHALLENGES = 'challenges',
  STREAKS = 'streaks',
  SOCIAL = 'social'
}

// Leaderboard periods
export enum LeaderboardPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  ALL_TIME = 'all_time'
}

// Player profile
export interface PlayerProfile {
  level: number;
  experience: number;
  experienceToNext: number;
  title: PlayerTitle;
  badges: Badge[];
  stats: PlayerStats;
  preferences: GameificationPreferences;
  joinedAt: Date;
  lastActive: Date;
}

// Player statistics
export interface PlayerStats {
  totalExperience: number;
  challengesCompleted: number;
  currentStreak: number;
  longestStreak: number;
  totalDuration: number;
  badgesEarned: number;
  leaderboardRank: Record<LeaderboardCategory, number>;
  socialConnections: number;
  achievementPoints: number;
}

// Gamification preferences
export interface GameificationPreferences {
  showLevel: boolean;
  showBadges: boolean;
  participateInLeaderboards: boolean;
  allowSocialFeatures: boolean;
  notificationSettings: NotificationSettings;
  displayName?: string;
  avatarUrl?: string;
}

// Notification settings
export interface NotificationSettings {
  levelUp: boolean;
  badgeEarned: boolean;
  challengeComplete: boolean;
  leaderboardUpdate: boolean;
  socialActivity: boolean;
  seasonalEvents: boolean;
}

// Badge
export interface Badge {
  id: string;
  name: string;
  description: string;
  category: BadgeCategory;
  iconUrl: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  earnedAt: Date;
  requirements: BadgeRequirement[];
  hidden: boolean;
}

// Badge requirement
export interface BadgeRequirement {
  type: 'experience' | 'duration' | 'count' | 'streak' | 'custom';
  value: number;
  description: string;
}

// Challenge
export interface Challenge {
  id: string;
  type: ChallengeType;
  name: string;
  description: string;
  difficulty: ChallengeDifficulty;
  requirements: ChallengeRequirement[];
  rewards: ChallengeReward[];
  startDate: Date;
  endDate: Date;
  progress: ChallengeProgress;
  isCompleted: boolean;
  participants: number;
  maxParticipants?: number;
  isPublic: boolean;
  createdBy?: string;
}

// Challenge requirement
export interface ChallengeRequirement {
  id: string;
  type: 'duration' | 'count' | 'behavior' | 'milestone';
  description: string;
  targetValue: number;
  currentValue: number;
  completed: boolean;
}

// Challenge reward
export interface ChallengeReward {
  type: 'experience' | 'badge' | 'title' | 'item';
  value: number;
  description: string;
  claimed: boolean;
}

// Challenge progress
export interface ChallengeProgress {
  percentage: number;
  requirementsCompleted: number;
  totalRequirements: number;
  lastUpdated: Date;
  milestones: ChallengeMilestone[];
}

// Challenge milestone
export interface ChallengeMilestone {
  id: string;
  name: string;
  description: string;
  requirement: number;
  reward: ChallengeReward;
  achieved: boolean;
  achievedAt?: Date;
}

// Challenge completion result
export interface ChallengeCompletion {
  challengeId: string;
  completedAt: Date;
  rewards: ChallengeReward[];
  experience: number;
  newBadges: Badge[];
  levelUp?: LevelUpResult;
}

// Level up result
export interface LevelResult {
  leveledUp: boolean;
  oldLevel: number;
  newLevel: number;
  experience: number;
  rewards?: LevelReward[];
}

// Level up result
export interface LevelUpResult {
  newLevel: number;
  rewards: LevelReward[];
  newTitle?: PlayerTitle;
  unlockedFeatures: string[];
}

// Level reward
export interface LevelReward {
  type: 'badge' | 'title' | 'feature' | 'customization';
  value: string;
  description: string;
}

// Leaderboard
export interface Leaderboard {
  id: string;
  category: LeaderboardCategory;
  period: LeaderboardPeriod;
  name: string;
  description: string;
  entries: LeaderboardEntry[];
  lastUpdated: Date;
  totalParticipants: number;
}

// Leaderboard entry
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  value: number;
  change: number; // Change in rank since last update
  badge?: string; // Special badge for top positions
}

// Leaderboard rank
export interface LeaderboardRank {
  category: LeaderboardCategory;
  period: LeaderboardPeriod;
  rank: number;
  totalParticipants: number;
  percentile: number;
  value: number;
}

// Season
export interface Season {
  id: string;
  name: string;
  description: string;
  theme: string;
  startDate: Date;
  endDate: Date;
  rewards: SeasonalReward[];
  challenges: string[]; // Challenge IDs
  leaderboards: string[]; // Special seasonal leaderboards
  isActive: boolean;
}

// Seasonal reward
export interface SeasonalReward {
  id: string;
  name: string;
  description: string;
  type: 'badge' | 'title' | 'avatar' | 'theme';
  requirement: RewardRequirement;
  claimed: boolean;
  claimedAt?: Date;
  exclusive: boolean; // Only available during this season
}

// Reward requirement
export interface RewardRequirement {
  type: 'participation' | 'rank' | 'challenges' | 'points';
  value: number;
  description: string;
}

// Social game features
export interface SocialGameFeatures {
  friends: GameFriend[];
  pendingRequests: FriendRequest[];
  recentActivity: SocialActivity[];
  groups: GameGroup[];
  comparisons: FriendComparison[];
}

// Game friend
export interface GameFriend {
  userId: string;
  displayName: string;
  level: number;
  title: PlayerTitle;
  lastActive: Date;
  mutualChallenges: string[];
  isOnline: boolean;
}

// Friend request
export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromDisplayName: string;
  message?: string;
  createdAt: Date;
  status: 'pending' | 'accepted' | 'declined';
}

// Social activity
export interface SocialActivity {
  id: string;
  userId: string;
  displayName: string;
  type: 'level_up' | 'badge_earned' | 'challenge_completed' | 'achievement_unlocked';
  description: string;
  timestamp: Date;
  data?: Record<string, any>;
}

// Game group
export interface GameGroup {
  id: string;
  name: string;
  description: string;
  members: GameGroupMember[];
  challenges: string[];
  leaderboard: LeaderboardEntry[];
  isPublic: boolean;
  createdAt: Date;
  adminId: string;
}

// Game group member
export interface GameGroupMember {
  userId: string;
  displayName: string;
  role: 'admin' | 'moderator' | 'member';
  joinedAt: Date;
  contribution: number;
}

// Friend comparison
export interface FriendComparison {
  friendId: string;
  friendName: string;
  categories: ComparisonCategory[];
  overallComparison: 'ahead' | 'behind' | 'tied';
}

// Comparison category
export interface ComparisonCategory {
  category: string;
  playerValue: number;
  friendValue: number;
  difference: number;
  status: 'ahead' | 'behind' | 'tied';
}

// Gamification state
export interface GameificationState {
  playerProfile: PlayerProfile;
  activeChallenges: Challenge[];
  leaderboards: Leaderboard[];
  currentSeason: Season | null;
  socialFeatures: SocialGameFeatures;
  availableBadges: Badge[];
  experienceHistory: ExperienceEvent[];
}

// Experience event
export interface ExperienceEvent {
  id: string;
  source: ExperienceSource;
  amount: number;
  description: string;
  timestamp: Date;
  multiplier?: number;
}

// Achievement unlock
export interface AchievementUnlock {
  type: 'badge' | 'level' | 'title' | 'feature';
  name: string;
  description: string;
  iconUrl?: string;
  experience: number;
}