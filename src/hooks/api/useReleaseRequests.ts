/**
 * Release Request Queries and Mutations
 * TanStack Query hooks for "Beg for Release" workflow
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { releaseRequestDBService } from "@/services/database/ReleaseRequestDBService";
import type { DBReleaseRequest } from "@/types/database";
import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("useReleaseRequests");

/**
 * Query for pending release requests (keyholder side)
 */
export function usePendingReleaseRequests(keyholderUserId?: string) {
  return useQuery({
    queryKey: ["releaseRequests", "pending", keyholderUserId],
    queryFn: async () => {
      if (!keyholderUserId) return [];
      const requests =
        await releaseRequestDBService.getPendingRequests(keyholderUserId);
      logger.debug("Fetched pending requests", { count: requests.length });
      return requests;
    },
    enabled: !!keyholderUserId,
    staleTime: 1000 * 30, // 30 seconds - refresh frequently for real-time feel
    refetchInterval: 1000 * 60, // Poll every minute
  });
}

/**
 * Query for requests for a specific session (submissive side)
 */
export function useSessionReleaseRequests(sessionId?: string) {
  return useQuery({
    queryKey: ["releaseRequests", "session", sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const requests =
        await releaseRequestDBService.getRequestsForSession(sessionId);
      logger.debug("Fetched session requests", { count: requests.length });
      return requests;
    },
    enabled: !!sessionId,
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Query for pending request for a specific session (submissive side)
 */
export function usePendingRequestForSession(sessionId?: string) {
  return useQuery({
    queryKey: ["releaseRequests", "session", sessionId, "pending"],
    queryFn: async () => {
      if (!sessionId) return null;
      const request =
        await releaseRequestDBService.getPendingRequestForSession(sessionId);
      logger.debug("Fetched pending request for session", {
        sessionId,
        found: !!request,
      });
      return request || null;
    },
    enabled: !!sessionId,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Poll every minute
  });
}

/**
 * Mutations for release request operations
 */
export function useReleaseRequestMutations() {
  const queryClient = useQueryClient();

  const createRequest = useMutation({
    mutationFn: async (params: {
      submissiveUserId: string;
      keyholderUserId: string;
      sessionId: string;
      reason?: string;
    }) => {
      const requestId = await releaseRequestDBService.createRequest(params);

      logger.info("Release request created", {
        requestId,
        sessionId: params.sessionId,
      });

      return requestId;
    },
    onSuccess: (_data, variables) => {
      // Invalidate pending requests for keyholder
      queryClient.invalidateQueries({
        queryKey: ["releaseRequests", "pending", variables.keyholderUserId],
      });

      // Invalidate session requests
      queryClient.invalidateQueries({
        queryKey: ["releaseRequests", "session", variables.sessionId],
      });
    },
    onError: (error) => {
      logger.error("Failed to create release request", { error });
    },
  });

  const approveRequest = useMutation({
    mutationFn: async (params: { requestId: string; response?: string }) => {
      await releaseRequestDBService.approveRequest(
        params.requestId,
        params.response,
      );

      logger.info("Release request approved", {
        requestId: params.requestId,
      });

      // Fetch the request to get associated data for invalidation
      const request = await releaseRequestDBService.findById(params.requestId);
      return request;
    },
    onSuccess: (request) => {
      if (request) {
        // Invalidate pending requests for keyholder
        queryClient.invalidateQueries({
          queryKey: ["releaseRequests", "pending", request.keyholderUserId],
        });

        // Invalidate session requests
        queryClient.invalidateQueries({
          queryKey: ["releaseRequests", "session", request.sessionId],
        });
      }
    },
    onError: (error) => {
      logger.error("Failed to approve release request", { error });
    },
  });

  const denyRequest = useMutation({
    mutationFn: async (params: { requestId: string; response?: string }) => {
      await releaseRequestDBService.denyRequest(
        params.requestId,
        params.response,
      );

      logger.info("Release request denied", {
        requestId: params.requestId,
      });

      // Fetch the request to get associated data for invalidation
      const request = await releaseRequestDBService.findById(params.requestId);
      return request;
    },
    onSuccess: (request) => {
      if (request) {
        // Invalidate pending requests for keyholder
        queryClient.invalidateQueries({
          queryKey: ["releaseRequests", "pending", request.keyholderUserId],
        });

        // Invalidate session requests
        queryClient.invalidateQueries({
          queryKey: ["releaseRequests", "session", request.sessionId],
        });
      }
    },
    onError: (error) => {
      logger.error("Failed to deny release request", { error });
    },
  });

  const cancelRequest = useMutation({
    mutationFn: async (params: { requestId: string }) => {
      // Fetch the request first to get associated data
      const request = await releaseRequestDBService.findById(params.requestId);

      if (!request) {
        throw new Error("Request not found");
      }

      await releaseRequestDBService.cancelRequest(params.requestId);

      logger.info("Release request cancelled", {
        requestId: params.requestId,
      });

      return request;
    },
    onSuccess: (request) => {
      // Invalidate pending requests for keyholder
      queryClient.invalidateQueries({
        queryKey: ["releaseRequests", "pending", request.keyholderUserId],
      });

      // Invalidate session requests
      queryClient.invalidateQueries({
        queryKey: ["releaseRequests", "session", request.sessionId],
      });
    },
    onError: (error) => {
      logger.error("Failed to cancel release request", { error });
    },
  });

  return {
    createRequest,
    approveRequest,
    denyRequest,
    cancelRequest,
  };
}
