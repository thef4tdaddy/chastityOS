/**
 * KeyholderRelationshipDBService Unit Tests
 * Tests for database operations for keyholder relationships
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { keyholderRelationshipDBService } from "../KeyholderRelationshipDBService";
import type {
  InviteCode,
  CreateInviteCodeData,
  AcceptInviteCodeData,
} from "../KeyholderRelationshipDBService";
import type {
  KeyholderRelationship,
  KeyholderPermissions,
} from "../../../types/core";

// Mock the database
vi.mock("../../storage/ChastityDB", () => ({
  db: {
    table: vi.fn(() => ({
      add: vi.fn(),
      get: vi.fn(),
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          first: vi.fn(),
          and: vi.fn(() => ({
            first: vi.fn(),
            toArray: vi.fn(),
          })),
          toArray: vi.fn(),
        })),
      })),
      delete: vi.fn(),
    })),
  },
}));

// Mock hash utility
vi.mock("../../../utils/helpers/hash", () => ({
  generateBackupCode: vi.fn(() => "ABC123"),
}));

// Mock logger
vi.mock("../../../utils/logging", () => ({
  serviceLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

describe("KeyholderRelationshipDBService", () => {
  const mockUserId = "test-user-123";
  const mockKeyholderUserId = "test-keyholder-456";
  const mockRelationshipId = "rel-789";

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock crypto.randomUUID using spyOn
    vi.spyOn(global.crypto, "randomUUID").mockReturnValue(
      "12345678-1234-1234-1234-123456789012",
    );
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("createInviteCode", () => {
    const mockData: CreateInviteCodeData = {
      submissiveUserId: mockUserId,
      submissiveName: "TestUser",
      expirationHours: 24,
    };

    it("should create invite code successfully", async () => {
      const { db } = await import("../../storage/ChastityDB");
      const mockTable = db.table("inviteCodes");
      (mockTable.where as any)().equals().first.mockResolvedValue(null);
      (mockTable.add as any).mockResolvedValue(undefined);

      const result =
        await keyholderRelationshipDBService.createInviteCode(mockData);

      expect(result).toBeDefined();
      expect(result.code).toBe("ABC123");
      expect(result.submissiveUserId).toBe(mockUserId);
      expect(result.submissiveName).toBe("TestUser");
      expect(result.isUsed).toBe(false);
      expect(mockTable.add).toHaveBeenCalled();
    });

    it("should generate unique code", async () => {
      const { generateBackupCode } = await import(
        "../../../utils/helpers/hash"
      );
      const { db } = await import("../../storage/ChastityDB");
      const mockTable = db.table("inviteCodes");

      // First call returns existing code, second call returns new code
      (mockTable.where as any)()
        .equals()
        .first.mockResolvedValueOnce({ code: "ABC123" })
        .mockResolvedValueOnce(null);

      (generateBackupCode as any)
        .mockReturnValueOnce("ABC123")
        .mockReturnValueOnce("DEF456");

      (mockTable.add as any).mockResolvedValue(undefined);

      const result =
        await keyholderRelationshipDBService.createInviteCode(mockData);

      expect(result.code).toBe("DEF456");
      expect(generateBackupCode).toHaveBeenCalledTimes(2);
    });

    it("should throw error after max retry attempts", async () => {
      const { db } = await import("../../storage/ChastityDB");
      const mockTable = db.table("inviteCodes");

      // Always return existing code
      (mockTable.where as any)()
        .equals()
        .first.mockResolvedValue({ code: "ABC123" });

      await expect(
        keyholderRelationshipDBService.createInviteCode(mockData),
      ).rejects.toThrow("Failed to generate unique invite code");
    });

    it("should use default expiration when not provided", async () => {
      const { db } = await import("../../storage/ChastityDB");
      const mockTable = db.table("inviteCodes");
      (mockTable.where as any)().equals().first.mockResolvedValue(null);
      (mockTable.add as any).mockResolvedValue(undefined);

      const dataWithoutExpiration = {
        submissiveUserId: mockUserId,
      };

      const result = await keyholderRelationshipDBService.createInviteCode(
        dataWithoutExpiration,
      );

      expect(result.expiresAt).toBeDefined();
      // Check expiration is approximately 24 hours from now
      const expectedExpiration = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const timeDiff = Math.abs(
        result.expiresAt.getTime() - expectedExpiration.getTime(),
      );
      expect(timeDiff).toBeLessThan(1000); // Within 1 second
    });
  });

  describe("acceptInviteCode", () => {
    const mockInviteCode: InviteCode = {
      id: "invite-123",
      code: "ABC123",
      submissiveUserId: mockUserId,
      submissiveName: "TestUser",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      isUsed: false,
    };

    const mockData: AcceptInviteCodeData = {
      inviteCode: "ABC123",
      keyholderUserId: mockKeyholderUserId,
      keyholderName: "Keyholder",
    };

    it("should accept valid invite code", async () => {
      const { db } = await import("../../storage/ChastityDB");
      const mockTable = db.table("inviteCodes");

      (mockTable.where as any)()
        .equals()
        .first.mockResolvedValue(mockInviteCode);

      const mockRelTable = db.table("keyholderRelationships");
      (mockRelTable.where as any)()
        .equals()
        .and()
        .and()
        .first.mockResolvedValue(null);

      const result =
        await keyholderRelationshipDBService.acceptInviteCode(mockData);

      expect(result).toBeDefined();
      expect(result.submissiveUserId).toBe(mockUserId);
      expect(result.keyholderUserId).toBe(mockKeyholderUserId);
      expect(result.status).toBe("active");
      expect(result.permissions).toBeDefined();
    });

    it("should throw error for invalid invite code", async () => {
      const { db } = await import("../../storage/ChastityDB");
      const mockTable = db.table("inviteCodes");

      (mockTable.where as any)().equals().first.mockResolvedValue(null);

      await expect(
        keyholderRelationshipDBService.acceptInviteCode(mockData),
      ).rejects.toThrow("Invalid invite code");
    });

    it("should throw error for already used invite code", async () => {
      const usedInviteCode = { ...mockInviteCode, isUsed: true };
      const { db } = await import("../../storage/ChastityDB");
      const mockTable = db.table("inviteCodes");

      (mockTable.where as any)()
        .equals()
        .first.mockResolvedValue(usedInviteCode);

      await expect(
        keyholderRelationshipDBService.acceptInviteCode(mockData),
      ).rejects.toThrow("Invite code has already been used");
    });

    it("should throw error for expired invite code", async () => {
      const expiredInviteCode = {
        ...mockInviteCode,
        expiresAt: new Date(Date.now() - 1000),
      };
      const { db } = await import("../../storage/ChastityDB");
      const mockTable = db.table("inviteCodes");

      (mockTable.where as any)()
        .equals()
        .first.mockResolvedValue(expiredInviteCode);

      await expect(
        keyholderRelationshipDBService.acceptInviteCode(mockData),
      ).rejects.toThrow("Invite code has expired");
    });

    it("should throw error when trying to link to yourself", async () => {
      const selfInviteCode = {
        ...mockInviteCode,
        submissiveUserId: mockKeyholderUserId,
      };
      const { db } = await import("../../storage/ChastityDB");
      const mockTable = db.table("inviteCodes");

      (mockTable.where as any)()
        .equals()
        .first.mockResolvedValue(selfInviteCode);

      await expect(
        keyholderRelationshipDBService.acceptInviteCode(mockData),
      ).rejects.toThrow("Cannot link to yourself");
    });

    it("should throw error when relationship already exists", async () => {
      const { db } = await import("../../storage/ChastityDB");
      const mockTable = db.table("inviteCodes");
      (mockTable.where as any)()
        .equals()
        .first.mockResolvedValue(mockInviteCode);

      const mockRelTable = db.table("keyholderRelationships");
      const existingRelationship: KeyholderRelationship = {
        id: "existing-rel",
        submissiveUserId: mockUserId,
        keyholderUserId: mockKeyholderUserId,
        status: "active",
        permissions: {} as KeyholderPermissions,
        createdAt: new Date(),
      };

      (mockRelTable.where as any)()
        .equals()
        .and()
        .and()
        .first.mockResolvedValue(existingRelationship);

      await expect(
        keyholderRelationshipDBService.acceptInviteCode(mockData),
      ).rejects.toThrow("Relationship already exists between these users");
    });
  });

  describe("getRelationshipsForUser", () => {
    it("should get relationships for user", async () => {
      const { db } = await import("../../storage/ChastityDB");
      const mockTable = db.table("keyholderRelationships");

      const mockRelationships = [
        {
          id: "rel-1",
          submissiveUserId: mockUserId,
          keyholderUserId: mockKeyholderUserId,
          status: "active",
          permissions: {} as KeyholderPermissions,
          createdAt: new Date(),
        },
      ];

      (mockTable.where as any)()
        .equals()
        .and()
        .toArray.mockResolvedValue(mockRelationships);

      const result =
        await keyholderRelationshipDBService.getRelationshipsForUser(
          mockUserId,
        );

      expect(result).toBeDefined();
      expect(result.asSubmissive).toBeDefined();
      expect(result.asKeyholder).toBeDefined();
    });

    it("should filter out ended relationships", async () => {
      const { db } = await import("../../storage/ChastityDB");
      const mockTable = db.table("keyholderRelationships");

      // Mock implementation of chained queries
      const mockChain = {
        equals: vi.fn(() => mockChain),
        and: vi.fn(() => mockChain),
        toArray: vi.fn().mockResolvedValue([]),
      };

      (mockTable.where as any).mockReturnValue(mockChain);

      await keyholderRelationshipDBService.getRelationshipsForUser(mockUserId);

      expect(mockChain.and).toHaveBeenCalled();
    });
  });

  describe("endRelationship", () => {
    it("should not throw error for placeholder implementation", async () => {
      // This is a placeholder implementation, so we just verify it doesn't crash
      await expect(
        keyholderRelationshipDBService.endRelationship(
          mockRelationshipId,
          mockUserId,
        ),
      ).resolves.not.toThrow();
    });
  });

  describe("updatePermissions", () => {
    const mockPermissions: KeyholderPermissions = {
      canLockSessions: true,
      canUnlockSessions: false,
      canCreateTasks: true,
      canApproveTasks: true,
      canViewFullHistory: true,
      canEditGoals: false,
      canSetRules: false,
    };

    it("should not throw error for placeholder implementation", async () => {
      // This is a placeholder implementation, so we just verify it doesn't crash
      await expect(
        keyholderRelationshipDBService.updatePermissions(
          mockRelationshipId,
          mockPermissions,
          mockUserId,
        ),
      ).resolves.not.toThrow();
    });
  });

  describe("getActiveInviteCodes", () => {
    it("should get active invite codes for user", async () => {
      const { db } = await import("../../storage/ChastityDB");
      const mockTable = db.table("inviteCodes");

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

      const mockChain = {
        equals: vi.fn(() => mockChain),
        and: vi.fn(() => mockChain),
        toArray: vi.fn().mockResolvedValue(mockInviteCodes),
      };

      (mockTable.where as any).mockReturnValue(mockChain);

      const result =
        await keyholderRelationshipDBService.getActiveInviteCodes(mockUserId);

      expect(result).toEqual(mockInviteCodes);
      expect(mockChain.and).toHaveBeenCalled();
    });

    it("should filter expired codes", async () => {
      const { db } = await import("../../storage/ChastityDB");
      const mockTable = db.table("inviteCodes");

      const mockChain = {
        equals: vi.fn(() => mockChain),
        and: vi.fn((filterFn) => {
          // Verify the filter function filters expired codes
          const expiredCode = {
            isUsed: false,
            expiresAt: new Date(Date.now() - 1000),
          };
          const validCode = {
            isUsed: false,
            expiresAt: new Date(Date.now() + 1000),
          };

          expect(filterFn(expiredCode)).toBe(false);
          expect(filterFn(validCode)).toBe(true);

          return mockChain;
        }),
        toArray: vi.fn().mockResolvedValue([]),
      };

      (mockTable.where as any).mockReturnValue(mockChain);

      await keyholderRelationshipDBService.getActiveInviteCodes(mockUserId);

      expect(mockChain.and).toHaveBeenCalled();
    });
  });

  describe("revokeInviteCode", () => {
    const mockInviteCode: InviteCode = {
      id: "invite-123",
      code: "ABC123",
      submissiveUserId: mockUserId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      isUsed: false,
    };

    it("should revoke invite code", async () => {
      const { db } = await import("../../storage/ChastityDB");
      const mockTable = db.table("inviteCodes");

      (mockTable.get as any).mockResolvedValue(mockInviteCode);
      (mockTable.delete as any).mockResolvedValue(undefined);

      await keyholderRelationshipDBService.revokeInviteCode(
        "invite-123",
        mockUserId,
      );

      expect(mockTable.get).toHaveBeenCalledWith("invite-123");
      expect(mockTable.delete).toHaveBeenCalledWith("invite-123");
    });

    it("should throw error for non-existent code", async () => {
      const { db } = await import("../../storage/ChastityDB");
      const mockTable = db.table("inviteCodes");

      (mockTable.get as any).mockResolvedValue(null);

      await expect(
        keyholderRelationshipDBService.revokeInviteCode(
          "non-existent",
          mockUserId,
        ),
      ).rejects.toThrow("Invite code not found");
    });

    it("should throw error for unauthorized revocation", async () => {
      const { db } = await import("../../storage/ChastityDB");
      const mockTable = db.table("inviteCodes");

      const otherUserCode = {
        ...mockInviteCode,
        submissiveUserId: "other-user",
      };
      (mockTable.get as any).mockResolvedValue(otherUserCode);

      await expect(
        keyholderRelationshipDBService.revokeInviteCode(
          "invite-123",
          mockUserId,
        ),
      ).rejects.toThrow("User not authorized to revoke this invite code");
    });
  });

  describe("Edge Cases", () => {
    it("should handle database errors gracefully", async () => {
      const { db } = await import("../../storage/ChastityDB");
      const mockTable = db.table("inviteCodes");

      (mockTable.where as any)()
        .equals()
        .first.mockRejectedValue(new Error("Database error"));

      await expect(
        keyholderRelationshipDBService.createInviteCode({
          submissiveUserId: mockUserId,
        }),
      ).rejects.toThrow();
    });

    it("should handle concurrent invite code creation", async () => {
      const { db } = await import("../../storage/ChastityDB");
      const { generateBackupCode } = await import(
        "../../../utils/helpers/hash"
      );
      const mockTable = db.table("inviteCodes");

      // Generate different codes for concurrent requests
      (generateBackupCode as any)
        .mockReturnValueOnce("CODE1")
        .mockReturnValueOnce("CODE2");

      (mockTable.where as any)().equals().first.mockResolvedValue(null);
      (mockTable.add as any).mockResolvedValue(undefined);

      const [result1, result2] = await Promise.all([
        keyholderRelationshipDBService.createInviteCode({
          submissiveUserId: mockUserId,
        }),
        keyholderRelationshipDBService.createInviteCode({
          submissiveUserId: "other-user",
        }),
      ]);

      expect(result1.code).toBe("CODE1");
      expect(result2.code).toBe("CODE2");
    });
  });
});
