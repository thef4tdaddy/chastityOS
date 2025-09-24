import { useQuery } from "@tanstack/react-query";
import { SessionService } from "@/services/api/session-service";
import { cacheConfig } from "@/services/queryClient";

export function useCurrentSession(userId: string | undefined) {
  return useQuery({
    queryKey: ["session", "current", userId],
    queryFn: async () => {
      if (!userId) return null;
      return SessionService.getCurrentSession(userId);
    },
    ...cacheConfig.currentSession, // Apply specific cache settings
    enabled: !!userId, // The query will not run until the userId is available
  });
}
