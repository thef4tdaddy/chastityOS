/**
 * Gamification data queries hook
 * Separates data fetching from main useGameification hook
 */

import { useQuery } from "@tanstack/react-query";
import {
  PlayerProfile,
  Challenge,
  Leaderboard,
  Season,
  SocialGameFeatures,
  ExperienceEvent,
} from "../../types/gamification";
import { GamificationStorageService } from "../../services/gamificationStorage";
import {
  DEFAULT_PLAYER_PROFILE,
  SAMPLE_CHALLENGES,
} from "../../constants/gamification";
import {
  generateSampleLeaderboards,
  generateSeasonalRewards,
} from "@/utils/gamification";

export function useGamificationData(userId: string) {
  // Get player profile
  const { data: playerProfile = DEFAULT_PLAYER_PROFILE } =
    useQuery<PlayerProfile>({
      queryKey: ["gamification", "profile", userId],
      queryFn: () => {
        const stored =
          GamificationStorageService.getPlayerProfile<PlayerProfile>();
        return stored
          ? { ...DEFAULT_PLAYER_PROFILE, ...stored }
          : DEFAULT_PLAYER_PROFILE;
      },
      enabled: Boolean(userId),
      staleTime: 30 * 1000,
    });

  // Get active challenges
  const { data: activeChallenges = [] } = useQuery<Challenge[]>({
    queryKey: ["gamification", "challenges", userId],
    queryFn: () => {
      const userChallenges =
        GamificationStorageService.getChallenges<Challenge>();
      return [...SAMPLE_CHALLENGES, ...userChallenges].filter(
        (c) => !c.isCompleted,
      );
    },
    enabled: Boolean(userId),
    staleTime: 60 * 1000,
  });

  // Get leaderboards
  const { data: leaderboards = [] } = useQuery<Leaderboard[]>({
    queryKey: ["gamification", "leaderboards"],
    queryFn: async () => generateSampleLeaderboards(),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });

  // Get current season
  const { data: currentSeason } = useQuery<Season | null>({
    queryKey: ["gamification", "season"],
    queryFn: () => ({
      id: "season-winter-2024",
      name: "Winter Challenge 2024",
      description:
        "Embrace the cold season with special winter-themed challenges",
      theme: "winter",
      startDate: new Date("2024-12-01"),
      endDate: new Date("2024-02-28"),
      rewards: generateSeasonalRewards(),
      challenges: ["winter-endurance", "cold-discipline"],
      leaderboards: ["winter-champions"],
      isActive: true,
    }),
    staleTime: 60 * 60 * 1000,
  });

  // Get social features
  const { data: socialFeatures } = useQuery<SocialGameFeatures>({
    queryKey: ["gamification", "social", userId],
    queryFn: () => {
      const stored =
        GamificationStorageService.getSocialFeatures<SocialGameFeatures>();
      return (
        stored || {
          friends: [],
          pendingRequests: [],
          recentActivity: [],
          groups: [],
          comparisons: [],
        }
      );
    },
    enabled: Boolean(userId) && playerProfile.preferences.allowSocialFeatures,
    staleTime: 2 * 60 * 1000,
  });

  // Get experience history
  const { data: experienceHistory = [] } = useQuery<ExperienceEvent[]>({
    queryKey: ["gamification", "experience", userId],
    queryFn: () =>
      GamificationStorageService.getExperienceHistory<ExperienceEvent>(),
    enabled: Boolean(userId),
    staleTime: 60 * 1000,
  });

  return {
    playerProfile,
    activeChallenges,
    leaderboards,
    currentSeason,
    socialFeatures,
    experienceHistory,
  };
}
