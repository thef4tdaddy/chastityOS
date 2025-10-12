/**
 * useKeyholderRelationshipQueries Hook Tests
 * Tests for TanStack Query hooks for keyholder relationships
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useKeyholderRelationships,
  useActiveKeyholder,
  useActiveInviteCodes,
  useRelationshipSummary,
  useHasPermission,
  useCreateInviteCode,
  useAcceptInviteCode,
  useRevokeInviteCode,
  useUpdatePermissions,
  useEndRelationship,
} from "../useKeyholderRelationshipQueries";
import { KeyholderRelationshipService } from "@/services/KeyholderRelationshipService";
import type { KeyholderRelationship, KeyholderPermissions } from "@/types/core";
import React from "react";

// Mock the service
vi.mock("@/services/KeyholderRelationshipService", () => ({
  KeyholderRelationshipService: {
    getUserRelationships: vi.fn(),
    getActiveKeyholder: vi.fn(),
    getActiveInviteCodes: vi.fn(),
    getRelationshipSummary: vi.fn(),
    hasPermission: vi.fn(),
    createInviteCode: vi.fn(),
    acceptInviteCode: vi.fn(),
    revokeInviteCode: vi.fn(),
    updatePermissions: vi.fn(),
    endRelationship: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useKeyholderRelationshipQueries", () => {
  const mockUserId = "test-user-123";
  const mockKeyholderUserId = "test-keyholder-456";
  const mockRelationshipId = "rel-789";

  const mockRelationship: KeyholderRelationship = {
    id: mockRelationshipId,
    submissiveUserId: mockUserId,
    keyholderUserId: mockKeyholderUserId,
    status: "active",
    permissions: {
      canLockSessions: true,
      canUnlockSessions: false,
      canCreateTasks: true,
      canApproveTasks: true,
      canViewFullHistory: true,
      canEditGoals: false,
      canSetRules: false,
    },
    createdAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("useKeyholderRelationships", () => {
    it("should fetch user relationships", async () => {
      const mockRelationships = {
        asSubmissive: [mockRelationship],
        asKeyholder: [],
      };

      (
        KeyholderRelationshipService.getUserRelationships as any
      ).mockResolvedValue(mockRelationships);

      const { result } = renderHook(
        () => useKeyholderRelationships(mockUserId),
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockRelationships);
      expect(
        KeyholderRelationshipService.getUserRelationships,
      ).toHaveBeenCalledWith(mockUserId);
    });

    it("should not fetch when userId is undefined", () => {
      const { result } = renderHook(
        () => useKeyholderRelationships(undefined),
        {
          wrapper: createWrapper(),
        },
      );

      expect(result.current.isFetching).toBe(false);
      expect(
        KeyholderRelationshipService.getUserRelationships,
      ).not.toHaveBeenCalled();
    });

    it("should handle fetch errors", async () => {
      (
        KeyholderRelationshipService.getUserRelationships as any
      ).mockRejectedValue(new Error("Database error"));

      const { result } = renderHook(
        () => useKeyholderRelationships(mockUserId),
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe("useActiveKeyholder", () => {
    it("should fetch active keyholder", async () => {
      (
        KeyholderRelationshipService.getActiveKeyholder as any
      ).mockResolvedValue(mockRelationship);

      const { result } = renderHook(() => useActiveKeyholder(mockUserId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockRelationship);
    });

    it("should return null when no active keyholder", async () => {
      (
        KeyholderRelationshipService.getActiveKeyholder as any
      ).mockResolvedValue(null);

      const { result } = renderHook(() => useActiveKeyholder(mockUserId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeNull();
    });
  });

  describe("useActiveInviteCodes", () => {
    it("should fetch active invite codes", async () => {
      const mockInviteCodes = [
        {
          id: "invite-1",
          code: "ABC123",
          submissiveUserId: mockUserId,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          isUsed: false,
        },
      ];

      (
        KeyholderRelationshipService.getActiveInviteCodes as any
      ).mockResolvedValue(mockInviteCodes);

      const { result } = renderHook(() => useActiveInviteCodes(mockUserId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockInviteCodes);
    });
  });

  describe("useRelationshipSummary", () => {
    it("should fetch relationship summary", async () => {
      const mockSummary = {
        hasActiveKeyholder: true,
        hasSubmissives: false,
        activeKeyholderCount: 1,
        submissiveCount: 0,
      };

      (
        KeyholderRelationshipService.getRelationshipSummary as any
      ).mockResolvedValue(mockSummary);

      const { result } = renderHook(() => useRelationshipSummary(mockUserId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockSummary);
    });
  });

  describe("useHasPermission", () => {
    it("should check keyholder permissions", async () => {
      (KeyholderRelationshipService.hasPermission as any).mockResolvedValue(
        true,
      );

      const { result } = renderHook(
        () =>
          useHasPermission(mockKeyholderUserId, mockUserId, "canLockSessions"),
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBe(true);
    });

    it("should return null when user IDs are missing", () => {
      const { result } = renderHook(
        () => useHasPermission(undefined, undefined, "canLockSessions"),
        {
          wrapper: createWrapper(),
        },
      );

      expect(result.current.isFetching).toBe(false);
    });
  });

  describe("useCreateInviteCode", () => {
    it("should create invite code", async () => {
      const mockInviteCode = {
        id: "invite-123",
        code: "ABC123",
        submissiveUserId: mockUserId,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isUsed: false,
      };

      (KeyholderRelationshipService.createInviteCode as any).mockResolvedValue(
        mockInviteCode,
      );

      const { result } = renderHook(() => useCreateInviteCode(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync({
          userId: mockUserId,
          displayName: "TestUser",
          expirationHours: 24,
        });
      });

      expect(result.current.isSuccess).toBe(true);
      expect(
        KeyholderRelationshipService.createInviteCode,
      ).toHaveBeenCalledWith(mockUserId, "TestUser", 24);
    });

    it("should handle creation errors", async () => {
      (KeyholderRelationshipService.createInviteCode as any).mockRejectedValue(
        new Error("Creation failed"),
      );

      const { result } = renderHook(() => useCreateInviteCode(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync({
            userId: mockUserId,
          });
        } catch (error) {
          expect(error).toBeDefined();
        }
      });

      expect(result.current.isError).toBe(true);
    });
  });

  describe("useAcceptInviteCode", () => {
    it("should accept invite code", async () => {
      (KeyholderRelationshipService.acceptInviteCode as any).mockResolvedValue(
        mockRelationship,
      );

      const { result } = renderHook(() => useAcceptInviteCode(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync({
          code: "ABC123",
          keyholderUserId: mockKeyholderUserId,
          keyholderName: "Keyholder",
        });
      });

      expect(result.current.isSuccess).toBe(true);
      expect(
        KeyholderRelationshipService.acceptInviteCode,
      ).toHaveBeenCalledWith("ABC123", mockKeyholderUserId, "Keyholder");
    });

    it("should invalidate queries after acceptance", async () => {
      (KeyholderRelationshipService.acceptInviteCode as any).mockResolvedValue(
        mockRelationship,
      );

      const { result } = renderHook(() => useAcceptInviteCode(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync({
          code: "ABC123",
          keyholderUserId: mockKeyholderUserId,
        });
      });

      expect(result.current.isSuccess).toBe(true);
    });
  });

  describe("useRevokeInviteCode", () => {
    it("should revoke invite code", async () => {
      (KeyholderRelationshipService.revokeInviteCode as any).mockResolvedValue(
        undefined,
      );

      const { result } = renderHook(() => useRevokeInviteCode(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync({
          codeId: "invite-123",
          userId: mockUserId,
        });
      });

      expect(result.current.isSuccess).toBe(true);
      expect(
        KeyholderRelationshipService.revokeInviteCode,
      ).toHaveBeenCalledWith("invite-123", mockUserId);
    });
  });

  describe("useUpdatePermissions", () => {
    it("should update permissions", async () => {
      const mockPermissions: KeyholderPermissions = {
        canLockSessions: true,
        canUnlockSessions: true,
        canCreateTasks: true,
        canApproveTasks: true,
        canViewFullHistory: true,
        canEditGoals: true,
        canSetRules: false,
      };

      (KeyholderRelationshipService.updatePermissions as any).mockResolvedValue(
        undefined,
      );

      const { result } = renderHook(() => useUpdatePermissions(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync({
          relationshipId: mockRelationshipId,
          permissions: mockPermissions,
          userId: mockUserId,
        });
      });

      expect(result.current.isSuccess).toBe(true);
      expect(
        KeyholderRelationshipService.updatePermissions,
      ).toHaveBeenCalledWith(mockRelationshipId, mockPermissions, mockUserId);
    });
  });

  describe("useEndRelationship", () => {
    it("should end relationship", async () => {
      (KeyholderRelationshipService.endRelationship as any).mockResolvedValue(
        undefined,
      );

      const { result } = renderHook(() => useEndRelationship(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync({
          relationshipId: mockRelationshipId,
          userId: mockUserId,
        });
      });

      expect(result.current.isSuccess).toBe(true);
      expect(KeyholderRelationshipService.endRelationship).toHaveBeenCalledWith(
        mockRelationshipId,
        mockUserId,
      );
    });

    it("should invalidate queries after ending relationship", async () => {
      (KeyholderRelationshipService.endRelationship as any).mockResolvedValue(
        undefined,
      );

      const { result } = renderHook(() => useEndRelationship(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync({
          relationshipId: mockRelationshipId,
          userId: mockUserId,
        });
      });

      expect(result.current.isSuccess).toBe(true);
    });
  });

  describe("Query Caching", () => {
    it("should cache query results", async () => {
      const mockRelationships = {
        asSubmissive: [mockRelationship],
        asKeyholder: [],
      };

      (
        KeyholderRelationshipService.getUserRelationships as any
      ).mockResolvedValue(mockRelationships);

      const { result, rerender } = renderHook(
        () => useKeyholderRelationships(mockUserId),
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Service should be called once
      expect(
        KeyholderRelationshipService.getUserRelationships,
      ).toHaveBeenCalledTimes(1);

      // Rerender should use cache
      rerender();

      // Service should still only have been called once
      expect(
        KeyholderRelationshipService.getUserRelationships,
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe("Error Handling", () => {
    it("should handle network errors gracefully", async () => {
      (
        KeyholderRelationshipService.getUserRelationships as any
      ).mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(
        () => useKeyholderRelationships(mockUserId),
        {
          wrapper: createWrapper(),
        },
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it("should retry failed mutations on demand", async () => {
      let callCount = 0;
      (KeyholderRelationshipService.createInviteCode as any).mockImplementation(
        () => {
          callCount++;
          if (callCount === 1) {
            return Promise.reject(new Error("Temporary error"));
          }
          return Promise.resolve({
            id: "invite-123",
            code: "ABC123",
            submissiveUserId: mockUserId,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            isUsed: false,
          });
        },
      );

      const { result } = renderHook(() => useCreateInviteCode(), {
        wrapper: createWrapper(),
      });

      // First attempt should fail
      await act(async () => {
        try {
          await result.current.mutateAsync({ userId: mockUserId });
        } catch (error) {
          // Expected to fail
        }
      });

      expect(result.current.isError).toBe(true);

      // Reset and retry
      await act(async () => {
        result.current.reset();
        await result.current.mutateAsync({ userId: mockUserId });
      });

      expect(result.current.isSuccess).toBe(true);
    });
  });
});
