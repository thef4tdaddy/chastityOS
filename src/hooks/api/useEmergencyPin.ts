/**
 * Emergency PIN TanStack Query Hooks
 * Encapsulates EmergencyPinDBService for use in components
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { EmergencyPinDBService } from "@/services/database/EmergencyPinDBService";
import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("useEmergencyPin");

/**
 * Query keys for emergency PIN operations
 */
const emergencyPinKeys = {
  all: (userId: string) => ["emergencyPin", userId] as const,
  status: (userId: string) => ["emergencyPin", userId, "status"] as const,
};

/**
 * Query to get emergency PIN status
 * Returns whether PIN exists and when it was created
 */
export function useEmergencyPinStatus(userId: string | undefined) {
  return useQuery({
    queryKey: emergencyPinKeys.status(userId || ""),
    queryFn: async () => {
      if (!userId) return null;
      const info = await EmergencyPinDBService.getEmergencyPinInfo(userId);
      logger.debug("Emergency PIN status fetched", { userId, info });
      return info;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes - PIN status doesn't change often
  });
}

/**
 * Mutation to set/update emergency PIN
 */
export function useSetEmergencyPin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, pin }: { userId: string; pin: string }) => {
      logger.info("Setting emergency PIN", { userId });
      await EmergencyPinDBService.setEmergencyPin(userId, pin);
    },
    onSuccess: (_, variables) => {
      logger.info("Emergency PIN set successfully", {
        userId: variables.userId,
      });
      // Invalidate status query to refetch
      queryClient.invalidateQueries({
        queryKey: emergencyPinKeys.status(variables.userId),
      });
    },
    onError: (error, variables) => {
      logger.error("Failed to set emergency PIN", {
        error: error as Error,
        userId: variables.userId,
      });
    },
  });
}

/**
 * Mutation to remove emergency PIN
 */
export function useRemoveEmergencyPin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      logger.info("Removing emergency PIN", { userId });
      await EmergencyPinDBService.removeEmergencyPin(userId);
    },
    onSuccess: (_, userId) => {
      logger.info("Emergency PIN removed successfully", { userId });
      // Invalidate status query
      queryClient.invalidateQueries({
        queryKey: emergencyPinKeys.status(userId),
      });
    },
    onError: (error, userId) => {
      logger.error("Failed to remove emergency PIN", {
        error: error as Error,
        userId,
      });
    },
  });
}

/**
 * Mutation to validate emergency PIN
 * Note: This is a mutation because validation should not be cached
 */
export function useValidateEmergencyPin() {
  return useMutation({
    mutationFn: async ({ userId, pin }: { userId: string; pin: string }) => {
      logger.info("Validating emergency PIN", { userId });
      const isValid = await EmergencyPinDBService.validatePin(userId, pin);
      return isValid;
    },
    onError: (error, variables) => {
      logger.error("PIN validation failed", {
        error: error as Error,
        userId: variables.userId,
      });
    },
  });
}

/**
 * Check if user has emergency PIN (utility function wrapper)
 */
export function useHasEmergencyPin(userId: string | undefined) {
  const { data: pinStatus } = useEmergencyPinStatus(userId);
  return pinStatus?.exists || false;
}
