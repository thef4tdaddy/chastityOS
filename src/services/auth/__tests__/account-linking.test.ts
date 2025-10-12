/**
 * AccountLinkingService Unit Tests
 * Tests for secure linking between keyholder and wearer accounts
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { AccountLinkingService } from "../account-linking";
import type { LinkCode } from "../../../types/account-linking";

// Mock Firebase
vi.mock("../../firebase", () => ({
  getFirebaseAuth: vi.fn(() =>
    Promise.resolve({
      currentUser: {
        uid: "test-user-123",
      },
    }),
  ),
  getFirestore: vi.fn(() => Promise.resolve({})),
}));

// Mock Firestore functions
vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  serverTimestamp: vi.fn(() => ({
    seconds: Date.now() / 1000,
    nanoseconds: 0,
  })),
  Timestamp: {
    fromDate: vi.fn((date: Date) => ({
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: 0,
      toDate: () => date,
    })),
  },
}));

// Mock hash utils
vi.mock("../../../utils/helpers/hash", () => ({
  generateUUID: vi.fn(() => "mock-uuid-123"),
}));

describe("AccountLinkingService", () => {
  const mockWearerId = "test-wearer-456";
  const mockKeyholderId = "test-keyholder-789";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("generateLinkCode", () => {
    it("should generate link code with default expiration", async () => {
      const { setDoc } = await import("firebase/firestore");
      (setDoc as any).mockResolvedValue(undefined);

      const result = await AccountLinkingService.generateLinkCode();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.code).toBeDefined();
      expect(result.data?.code.length).toBe(12);
      expect(result.data?.expiresIn).toBe("24 hours");
      expect(result.data?.shareUrl).toContain("/link/");
    });

    it("should return error when not authenticated", async () => {
      const { getFirebaseAuth } = await import("../../firebase");
      (getFirebaseAuth as any).mockResolvedValueOnce({
        currentUser: null,
      });

      const result = await AccountLinkingService.generateLinkCode();

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "Authentication required to generate link codes",
      );
    });
  });

  describe("validateLinkCode", () => {
    it("should validate active link code", async () => {
      const mockLinkCode: LinkCode = {
        id: "ABC123456789",
        wearerId: mockWearerId,
        createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        expiresAt: {
          seconds: (Date.now() + 24 * 60 * 60 * 1000) / 1000,
          nanoseconds: 0,
          toDate: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
        } as any,
        status: "pending",
        maxUses: 1,
        usedBy: null,
        shareMethod: "manual",
      };

      const { getDoc } = await import("firebase/firestore");
      (getDoc as any).mockResolvedValue({
        exists: () => true,
        data: () => mockLinkCode,
      });

      const result =
        await AccountLinkingService.validateLinkCode("ABC123456789");

      expect(result.isValid).toBe(true);
      expect(result.canUse).toBe(true);
    });

    it("should reject expired link code", async () => {
      const expiredLinkCode: LinkCode = {
        id: "EXPIRED12345",
        wearerId: mockWearerId,
        createdAt: {
          seconds: (Date.now() - 48 * 60 * 60 * 1000) / 1000,
          nanoseconds: 0,
        } as any,
        expiresAt: {
          seconds: (Date.now() - 1000) / 1000,
          nanoseconds: 0,
          toDate: () => new Date(Date.now() - 1000),
        } as any,
        status: "pending",
        maxUses: 1,
        usedBy: null,
        shareMethod: "manual",
      };

      const { getDoc } = await import("firebase/firestore");
      (getDoc as any).mockResolvedValue({
        exists: () => true,
        data: () => expiredLinkCode,
      });

      const result =
        await AccountLinkingService.validateLinkCode("EXPIRED12345");

      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Link code has expired");
    });

    it("should reject already used link code", async () => {
      const usedLinkCode: LinkCode = {
        id: "USED12345678",
        wearerId: mockWearerId,
        createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        expiresAt: {
          seconds: (Date.now() + 24 * 60 * 60 * 1000) / 1000,
          nanoseconds: 0,
          toDate: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
        } as any,
        status: "used",
        maxUses: 1,
        usedBy: mockKeyholderId,
        shareMethod: "manual",
      };

      const { getDoc } = await import("firebase/firestore");
      (getDoc as any).mockResolvedValue({
        exists: () => true,
        data: () => usedLinkCode,
      });

      const result =
        await AccountLinkingService.validateLinkCode("USED12345678");

      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Link code has already been used");
    });
  });
});
