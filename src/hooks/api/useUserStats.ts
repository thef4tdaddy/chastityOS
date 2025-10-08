/**
 * User Stats Hook
 * Provides access to user statistics including points and task completion
 */
import { useQuery } from "@tanstack/react-query";
import { userStatsService, type UserStats } from "@/services/database/UserStatsService";
import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("useUserStats");

/**
 * Hook for fetching user stats
 */
export function useUserStats(userId: string | undefined) {
  return useQuery<UserStats | null>({
    queryKey: ["userStats", userId],
    queryFn: async () => {
      if (!userId) {
        return null;
      }

      try {
        const stats = await userStatsService.getStats(userId);
        return stats;
      } catch (error) {
        logger.error("Failed to fetch user stats", { error, userId });
        throw error;
      }
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: true,
  });
}
