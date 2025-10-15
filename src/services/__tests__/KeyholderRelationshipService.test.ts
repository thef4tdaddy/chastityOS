/**
 * KeyholderRelationshipService Unit Tests
 * Tests for business logic layer of keyholder-submissive relationships
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { KeyholderRelationshipService } from "../KeyholderRelationshipService";
import { keyholderRelationshipDBService } from "../database/KeyholderRelationshipDBService";
import type {
  KeyholderRelationship,
  KeyholderPermissions,
} from "../../types/core";

// Mock the database service
vi.mock("../database/KeyholderRelationshipDBService", () => ({
  keyholderRelationshipDBService: {
    createInviteCode: vi.fn(),
    acceptInviteCode: vi.fn(),
    getRelationshipsForUser: vi.fn(),
    updatePermissions: vi.fn(),
    endRelationship: vi.fn(),
    getActiveInviteCodes: vi.fn(),
    revokeInviteCode: vi.fn(),
  },
}));

// Mock notification service
vi.mock("../notifications", () => ({
  NotificationService: {
    notifyKeyholderRequest: vi.fn(() => Promise.resolve(undefined)),
  },
}));

describe("KeyholderRelationshipService", () => {
  const mockUserId = "test-user-123";
  const mockKeyholderUserId = "test-keyholder-456";
  const mockRelationshipId = "rel-789";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("createInviteCode", () => {
    it("should create an invite code successfully", async () => {
      const mockInviteCode = {
        id: "invite-123",
        code: "ABC123",
        submissiveUserId: mockUserId,
        submissiveName: "TestUser",
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isUsed: false,
      };

      (
        keyholderRelationshipDBService.getActiveInviteCodes as any
      ).mockResolvedValue([]);
      (
        keyholderRelationshipDBService.createInviteCode as any
      ).mockResolvedValue(mockInviteCode);

      const result = await KeyholderRelationshipService.createInviteCode(
        mockUserId,
        "TestUser",
        24,
      );

      expect(result).toEqual(mockInviteCode);
      expect(
        keyholderRelationshipDBService.createInviteCode,
      ).toHaveBeenCalledWith({
        submissiveUserId: mockUserId,
        submissiveName: "TestUser",
        expirationHours: 24,
      });
    });

    it("should throw error when user ID is missing", async () => {
      await expect(
        KeyholderRelationshipService.createInviteCode("", "TestUser"),
      ).rejects.toThrow("User ID is required to create an invite code");
    });

    it("should throw error when max active invites reached", async () => {
      const mockInviteCodes = [
        { id: "1", code: "ABC123" },
        { id: "2", code: "DEF456" },
        { id: "3", code: "GHI789" },
      ];

      (
        keyholderRelationshipDBService.getActiveInviteCodes as any
      ).mockResolvedValue(mockInviteCodes);

      await expect(
        KeyholderRelationshipService.createInviteCode(mockUserId),
      ).rejects.toThrow("Maximum of 3 active invite codes allowed at once");
    });

    it("should handle permission denied errors", async () => {
      (
        keyholderRelationshipDBService.getActiveInviteCodes as any
      ).mockResolvedValue([]);
      (
        keyholderRelationshipDBService.createInviteCode as any
      ).mockRejectedValue(new Error("permission-denied: Access denied"));

      await expect(
        KeyholderRelationshipService.createInviteCode(mockUserId),
      ).rejects.toThrow(
        "Permission denied: You don't have access to create invite codes",
      );
    });

    it("should handle network errors", async () => {
      (
        keyholderRelationshipDBService.getActiveInviteCodes as any
      ).mockResolvedValue([]);
      (
        keyholderRelationshipDBService.createInviteCode as any
      ).mockRejectedValue(new Error("network error: Connection failed"));

      await expect(
        KeyholderRelationshipService.createInviteCode(mockUserId),
      ).rejects.toThrow(
        "Network error: Please check your internet connection and try again",
      );
    });
  });

  describe("acceptInviteCode", () => {
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
      acceptedAt: new Date(),
    };

    it("should accept invite code successfully", async () => {
      (
        keyholderRelationshipDBService.acceptInviteCode as any
      ).mockResolvedValue(mockRelationship);

      const result = await KeyholderRelationshipService.acceptInviteCode(
        "ABC123",
        mockKeyholderUserId,
        "Keyholder",
      );

      expect(result).toEqual(mockRelationship);
      expect(
        keyholderRelationshipDBService.acceptInviteCode,
      ).toHaveBeenCalledWith({
        inviteCode: "ABC123",
        keyholderUserId: mockKeyholderUserId,
        keyholderName: "Keyholder",
      });
    });

    it("should validate invite code format", async () => {
      await expect(
        KeyholderRelationshipService.acceptInviteCode(
          "invalid",
          mockKeyholderUserId,
        ),
      ).rejects.toThrow(
        "Invalid invite code format. Code must be 6 alphanumeric characters.",
      );
    });

    it("should throw error when invite code is missing", async () => {
      await expect(
        KeyholderRelationshipService.acceptInviteCode("", mockKeyholderUserId),
      ).rejects.toThrow("Invite code and user ID are required");
    });

    it("should throw error when keyholder user ID is missing", async () => {
      await expect(
        KeyholderRelationshipService.acceptInviteCode("ABC123", ""),
      ).rejects.toThrow("Invite code and user ID are required");
    });

    it("should handle invite not found errors", async () => {
      (
        keyholderRelationshipDBService.acceptInviteCode as any
      ).mockRejectedValue(new Error("Invite code not found"));

      await expect(
        KeyholderRelationshipService.acceptInviteCode(
          "ABC123",
          mockKeyholderUserId,
        ),
      ).rejects.toThrow(
        "Invalid or expired invite code. Please check the code and try again.",
      );
    });

    it("should handle already used invite codes", async () => {
      (
        keyholderRelationshipDBService.acceptInviteCode as any
      ).mockRejectedValue(new Error("Invite code already used"));

      await expect(
        KeyholderRelationshipService.acceptInviteCode(
          "ABC123",
          mockKeyholderUserId,
        ),
      ).rejects.toThrow("This invite code has already been used.");
    });

    it("should handle expired invite codes", async () => {
      (
        keyholderRelationshipDBService.acceptInviteCode as any
      ).mockRejectedValue(new Error("Invite code expired"));

      await expect(
        KeyholderRelationshipService.acceptInviteCode(
          "ABC123",
          mockKeyholderUserId,
        ),
      ).rejects.toThrow(
        "This invite code has expired. Please request a new one.",
      );
    });
  });

  describe("getUserRelationships", () => {
    it("should get user relationships", async () => {
      const mockRelationships = {
        asSubmissive: [
          {
            id: "rel-1",
            submissiveUserId: mockUserId,
            keyholderUserId: mockKeyholderUserId,
            status: "active" as const,
            permissions: {} as KeyholderPermissions,
            createdAt: new Date(),
          },
        ],
        asKeyholder: [],
      };

      (
        keyholderRelationshipDBService.getRelationshipsForUser as any
      ).mockResolvedValue(mockRelationships);

      const result =
        await KeyholderRelationshipService.getUserRelationships(mockUserId);

      expect(result).toEqual(mockRelationships);
      expect(
        keyholderRelationshipDBService.getRelationshipsForUser,
      ).toHaveBeenCalledWith(mockUserId);
    });

    it("should handle errors when getting relationships", async () => {
      (
        keyholderRelationshipDBService.getRelationshipsForUser as any
      ).mockRejectedValue(new Error("Database error"));

      await expect(
        KeyholderRelationshipService.getUserRelationships(mockUserId),
      ).rejects.toThrow("Database error");
    });
  });

  describe("getActiveKeyholder", () => {
    it("should return active keyholder relationship", async () => {
      const mockRelationship: KeyholderRelationship = {
        id: mockRelationshipId,
        submissiveUserId: mockUserId,
        keyholderUserId: mockKeyholderUserId,
        status: "active",
        permissions: {} as KeyholderPermissions,
        createdAt: new Date(),
      };

      (
        keyholderRelationshipDBService.getRelationshipsForUser as any
      ).mockResolvedValue({
        asSubmissive: [mockRelationship],
        asKeyholder: [],
      });

      const result =
        await KeyholderRelationshipService.getActiveKeyholder(mockUserId);

      expect(result).toEqual(mockRelationship);
    });

    it("should return null when no active keyholder", async () => {
      (
        keyholderRelationshipDBService.getRelationshipsForUser as any
      ).mockResolvedValue({
        asSubmissive: [],
        asKeyholder: [],
      });

      const result =
        await KeyholderRelationshipService.getActiveKeyholder(mockUserId);

      expect(result).toBeNull();
    });

    it("should only return active relationships", async () => {
      const endedRelationship: KeyholderRelationship = {
        id: mockRelationshipId,
        submissiveUserId: mockUserId,
        keyholderUserId: mockKeyholderUserId,
        status: "ended",
        permissions: {} as KeyholderPermissions,
        createdAt: new Date(),
      };

      (
        keyholderRelationshipDBService.getRelationshipsForUser as any
      ).mockResolvedValue({
        asSubmissive: [endedRelationship],
        asKeyholder: [],
      });

      const result =
        await KeyholderRelationshipService.getActiveKeyholder(mockUserId);

      expect(result).toBeNull();
    });
  });

  describe("hasPermission", () => {
    it("should return true when keyholder has permission", async () => {
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

      (
        keyholderRelationshipDBService.getRelationshipsForUser as any
      ).mockResolvedValue({
        asSubmissive: [],
        asKeyholder: [mockRelationship],
      });

      const result = await KeyholderRelationshipService.hasPermission(
        mockKeyholderUserId,
        mockUserId,
        "canLockSessions",
      );

      expect(result).toBe(true);
    });

    it("should return false when keyholder lacks permission", async () => {
      const mockRelationship: KeyholderRelationship = {
        id: mockRelationshipId,
        submissiveUserId: mockUserId,
        keyholderUserId: mockKeyholderUserId,
        status: "active",
        permissions: {
          canLockSessions: false,
          canUnlockSessions: false,
          canCreateTasks: true,
          canApproveTasks: true,
          canViewFullHistory: true,
          canEditGoals: false,
          canSetRules: false,
        },
        createdAt: new Date(),
      };

      (
        keyholderRelationshipDBService.getRelationshipsForUser as any
      ).mockResolvedValue({
        asSubmissive: [],
        asKeyholder: [mockRelationship],
      });

      const result = await KeyholderRelationshipService.hasPermission(
        mockKeyholderUserId,
        mockUserId,
        "canLockSessions",
      );

      expect(result).toBe(false);
    });

    it("should return false when relationship does not exist", async () => {
      (
        keyholderRelationshipDBService.getRelationshipsForUser as any
      ).mockResolvedValue({
        asSubmissive: [],
        asKeyholder: [],
      });

      const result = await KeyholderRelationshipService.hasPermission(
        mockKeyholderUserId,
        mockUserId,
        "canLockSessions",
      );

      expect(result).toBe(false);
    });

    it("should return false when relationship is not active", async () => {
      const mockRelationship: KeyholderRelationship = {
        id: mockRelationshipId,
        submissiveUserId: mockUserId,
        keyholderUserId: mockKeyholderUserId,
        status: "ended",
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

      (
        keyholderRelationshipDBService.getRelationshipsForUser as any
      ).mockResolvedValue({
        asSubmissive: [],
        asKeyholder: [mockRelationship],
      });

      const result = await KeyholderRelationshipService.hasPermission(
        mockKeyholderUserId,
        mockUserId,
        "canLockSessions",
      );

      expect(result).toBe(false);
    });

    it("should handle errors gracefully", async () => {
      (
        keyholderRelationshipDBService.getRelationshipsForUser as any
      ).mockRejectedValue(new Error("Database error"));

      const result = await KeyholderRelationshipService.hasPermission(
        mockKeyholderUserId,
        mockUserId,
        "canLockSessions",
      );

      expect(result).toBe(false);
    });
  });

  describe("updatePermissions", () => {
    const mockPermissions: KeyholderPermissions = {
      canLockSessions: true,
      canUnlockSessions: true,
      canCreateTasks: true,
      canApproveTasks: true,
      canViewFullHistory: true,
      canEditGoals: true,
      canSetRules: false,
    };

    it("should update permissions successfully", async () => {
      (
        keyholderRelationshipDBService.updatePermissions as any
      ).mockResolvedValue(undefined);

      await KeyholderRelationshipService.updatePermissions(
        mockRelationshipId,
        mockPermissions,
        mockUserId,
      );

      expect(
        keyholderRelationshipDBService.updatePermissions,
      ).toHaveBeenCalledWith(mockRelationshipId, mockPermissions, mockUserId);
    });

    it("should throw error when relationship ID is missing", async () => {
      await expect(
        KeyholderRelationshipService.updatePermissions(
          "",
          mockPermissions,
          mockUserId,
        ),
      ).rejects.toThrow("Relationship ID and user ID are required");
    });

    it("should throw error when user ID is missing", async () => {
      await expect(
        KeyholderRelationshipService.updatePermissions(
          mockRelationshipId,
          mockPermissions,
          "",
        ),
      ).rejects.toThrow("Relationship ID and user ID are required");
    });

    it("should throw error when permissions object is invalid", async () => {
      await expect(
        KeyholderRelationshipService.updatePermissions(
          mockRelationshipId,
          null as any,
          mockUserId,
        ),
      ).rejects.toThrow("Valid permissions object is required");
    });

    it("should handle permission denied errors", async () => {
      (
        keyholderRelationshipDBService.updatePermissions as any
      ).mockRejectedValue(new Error("permission-denied"));

      await expect(
        KeyholderRelationshipService.updatePermissions(
          mockRelationshipId,
          mockPermissions,
          mockUserId,
        ),
      ).rejects.toThrow(
        "Permission denied: Only the submissive can update permissions.",
      );
    });

    it("should handle not found errors", async () => {
      (
        keyholderRelationshipDBService.updatePermissions as any
      ).mockRejectedValue(new Error("Relationship not found"));

      await expect(
        KeyholderRelationshipService.updatePermissions(
          mockRelationshipId,
          mockPermissions,
          mockUserId,
        ),
      ).rejects.toThrow("Relationship not found. It may have been deleted.");
    });
  });

  describe("endRelationship", () => {
    it("should end relationship successfully", async () => {
      (keyholderRelationshipDBService.endRelationship as any).mockResolvedValue(
        undefined,
      );

      await KeyholderRelationshipService.endRelationship(
        mockRelationshipId,
        mockUserId,
      );

      expect(
        keyholderRelationshipDBService.endRelationship,
      ).toHaveBeenCalledWith(mockRelationshipId, mockUserId);
    });

    it("should handle errors when ending relationship", async () => {
      (keyholderRelationshipDBService.endRelationship as any).mockRejectedValue(
        new Error("Database error"),
      );

      await expect(
        KeyholderRelationshipService.endRelationship(
          mockRelationshipId,
          mockUserId,
        ),
      ).rejects.toThrow("Database error");
    });
  });

  describe("getActiveInviteCodes", () => {
    it("should get active invite codes", async () => {
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
        keyholderRelationshipDBService.getActiveInviteCodes as any
      ).mockResolvedValue(mockInviteCodes);

      const result =
        await KeyholderRelationshipService.getActiveInviteCodes(mockUserId);

      expect(result).toEqual(mockInviteCodes);
      expect(
        keyholderRelationshipDBService.getActiveInviteCodes,
      ).toHaveBeenCalledWith(mockUserId);
    });

    it("should handle errors when getting invite codes", async () => {
      (
        keyholderRelationshipDBService.getActiveInviteCodes as any
      ).mockRejectedValue(new Error("Database error"));

      await expect(
        KeyholderRelationshipService.getActiveInviteCodes(mockUserId),
      ).rejects.toThrow("Database error");
    });
  });

  describe("revokeInviteCode", () => {
    it("should revoke invite code successfully", async () => {
      (
        keyholderRelationshipDBService.revokeInviteCode as any
      ).mockResolvedValue(undefined);

      await KeyholderRelationshipService.revokeInviteCode(
        "invite-123",
        mockUserId,
      );

      expect(
        keyholderRelationshipDBService.revokeInviteCode,
      ).toHaveBeenCalledWith("invite-123", mockUserId);
    });

    it("should handle errors when revoking invite code", async () => {
      (
        keyholderRelationshipDBService.revokeInviteCode as any
      ).mockRejectedValue(new Error("Database error"));

      await expect(
        KeyholderRelationshipService.revokeInviteCode("invite-123", mockUserId),
      ).rejects.toThrow("Database error");
    });
  });

  describe("validateInviteCodeFormat", () => {
    it("should validate correct 6-character alphanumeric code", () => {
      expect(
        KeyholderRelationshipService.validateInviteCodeFormat("ABC123"),
      ).toBe(true);
      expect(
        KeyholderRelationshipService.validateInviteCodeFormat("ZZZZZZ"),
      ).toBe(true);
      expect(
        KeyholderRelationshipService.validateInviteCodeFormat("000000"),
      ).toBe(true);
    });

    it("should reject invalid formats", () => {
      expect(
        KeyholderRelationshipService.validateInviteCodeFormat("abc123"),
      ).toBe(false); // lowercase
      expect(
        KeyholderRelationshipService.validateInviteCodeFormat("ABC12"),
      ).toBe(false); // too short
      expect(
        KeyholderRelationshipService.validateInviteCodeFormat("ABC1234"),
      ).toBe(false); // too long
      expect(
        KeyholderRelationshipService.validateInviteCodeFormat("ABC-12"),
      ).toBe(false); // special char
      expect(KeyholderRelationshipService.validateInviteCodeFormat("")).toBe(
        false,
      ); // empty
    });
  });

  describe("canCreateInviteCode", () => {
    it("should allow creating invite code when no active relationship", async () => {
      (
        keyholderRelationshipDBService.getRelationshipsForUser as any
      ).mockResolvedValue({
        asSubmissive: [],
        asKeyholder: [],
      });

      const result =
        await KeyholderRelationshipService.canCreateInviteCode(mockUserId);

      expect(result).toBe(true);
    });

    it("should not allow creating invite code when active relationship exists", async () => {
      (
        keyholderRelationshipDBService.getRelationshipsForUser as any
      ).mockResolvedValue({
        asSubmissive: [
          {
            id: mockRelationshipId,
            submissiveUserId: mockUserId,
            keyholderUserId: mockKeyholderUserId,
            status: "active",
            permissions: {} as KeyholderPermissions,
            createdAt: new Date(),
          },
        ],
        asKeyholder: [],
      });

      const result =
        await KeyholderRelationshipService.canCreateInviteCode(mockUserId);

      expect(result).toBe(false);
    });

    it("should allow creating invite code when only ended relationships exist", async () => {
      (
        keyholderRelationshipDBService.getRelationshipsForUser as any
      ).mockResolvedValue({
        asSubmissive: [
          {
            id: mockRelationshipId,
            submissiveUserId: mockUserId,
            keyholderUserId: mockKeyholderUserId,
            status: "ended",
            permissions: {} as KeyholderPermissions,
            createdAt: new Date(),
          },
        ],
        asKeyholder: [],
      });

      const result =
        await KeyholderRelationshipService.canCreateInviteCode(mockUserId);

      expect(result).toBe(true);
    });

    it("should return false on error", async () => {
      (
        keyholderRelationshipDBService.getRelationshipsForUser as any
      ).mockRejectedValue(new Error("Database error"));

      const result =
        await KeyholderRelationshipService.canCreateInviteCode(mockUserId);

      expect(result).toBe(false);
    });
  });

  describe("getRelationshipSummary", () => {
    it("should return correct summary with active relationships", async () => {
      (
        keyholderRelationshipDBService.getRelationshipsForUser as any
      ).mockResolvedValue({
        asSubmissive: [
          {
            id: "rel-1",
            submissiveUserId: mockUserId,
            keyholderUserId: mockKeyholderUserId,
            status: "active",
            permissions: {} as KeyholderPermissions,
            createdAt: new Date(),
          },
        ],
        asKeyholder: [
          {
            id: "rel-2",
            submissiveUserId: "other-user",
            keyholderUserId: mockUserId,
            status: "active",
            permissions: {} as KeyholderPermissions,
            createdAt: new Date(),
          },
        ],
      });

      const result =
        await KeyholderRelationshipService.getRelationshipSummary(mockUserId);

      expect(result).toEqual({
        hasActiveKeyholder: true,
        hasSubmissives: true,
        activeKeyholderCount: 1,
        submissiveCount: 1,
      });
    });

    it("should return correct summary with no active relationships", async () => {
      (
        keyholderRelationshipDBService.getRelationshipsForUser as any
      ).mockResolvedValue({
        asSubmissive: [],
        asKeyholder: [],
      });

      const result =
        await KeyholderRelationshipService.getRelationshipSummary(mockUserId);

      expect(result).toEqual({
        hasActiveKeyholder: false,
        hasSubmissives: false,
        activeKeyholderCount: 0,
        submissiveCount: 0,
      });
    });

    it("should only count active relationships", async () => {
      (
        keyholderRelationshipDBService.getRelationshipsForUser as any
      ).mockResolvedValue({
        asSubmissive: [
          {
            id: "rel-1",
            status: "active",
            permissions: {} as KeyholderPermissions,
            createdAt: new Date(),
          },
          {
            id: "rel-2",
            status: "ended",
            permissions: {} as KeyholderPermissions,
            createdAt: new Date(),
          },
        ],
        asKeyholder: [
          {
            id: "rel-3",
            status: "active",
            permissions: {} as KeyholderPermissions,
            createdAt: new Date(),
          },
          {
            id: "rel-4",
            status: "active",
            permissions: {} as KeyholderPermissions,
            createdAt: new Date(),
          },
        ],
      });

      const result =
        await KeyholderRelationshipService.getRelationshipSummary(mockUserId);

      expect(result).toEqual({
        hasActiveKeyholder: true,
        hasSubmissives: true,
        activeKeyholderCount: 1,
        submissiveCount: 2,
      });
    });

    it("should handle errors when getting summary", async () => {
      (
        keyholderRelationshipDBService.getRelationshipsForUser as any
      ).mockRejectedValue(new Error("Database error"));

      await expect(
        KeyholderRelationshipService.getRelationshipSummary(mockUserId),
      ).rejects.toThrow("Database error");
    });
  });
});
