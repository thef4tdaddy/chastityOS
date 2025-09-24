import { useQuery } from "@tanstack/react-query";
import { sessionDBService } from "@/services/database";
import { cacheConfig } from "@/services/cache-config";

export function useCurrentSession(userId: string | undefined) {
  return useQuery({
    queryKey: ["session", "current", userId],
    queryFn: async () => {
      if (!userId) return null;
      return sessionDBService.getCurrentSession(userId);
    },
    ...cacheConfig.currentSession, // Apply specific cache settings
    enabled: !!userId, // The query will not run until the userId is available
  });
}
