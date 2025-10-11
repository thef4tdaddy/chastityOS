/**
 * Tests for DataImportService
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { importUserData, validateImportData } from "../DataImportService";
import { db } from "../../storage/ChastityDB";

// Mock the database
vi.mock("../../storage/ChastityDB", () => ({
  db: {
    transaction: vi.fn(),
    sessions: {
      where: vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          delete: vi.fn().mockResolvedValue(undefined),
        }),
      }),
      bulkAdd: vi.fn().mockResolvedValue(undefined),
    },
    events: {
      where: vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          delete: vi.fn().mockResolvedValue(undefined),
        }),
      }),
      bulkAdd: vi.fn().mockResolvedValue(undefined),
    },
    tasks: {
      where: vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          delete: vi.fn().mockResolvedValue(undefined),
        }),
      }),
      bulkAdd: vi.fn().mockResolvedValue(undefined),
    },
    goals: {
      where: vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          delete: vi.fn().mockResolvedValue(undefined),
        }),
      }),
      bulkAdd: vi.fn().mockResolvedValue(undefined),
    },
    settings: {
      where: vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          delete: vi.fn().mockResolvedValue(undefined),
        }),
      }),
      bulkAdd: vi.fn().mockResolvedValue(undefined),
    },
    rules: {
      where: vi.fn().mockReturnValue({
        or: vi.fn().mockReturnValue({
          equals: vi.fn().mockReturnValue({
            delete: vi.fn().mockResolvedValue(undefined),
          }),
        }),
      }),
      bulkAdd: vi.fn().mockResolvedValue(undefined),
    },
  },
}));

// Mock the logger
vi.mock("@/utils/logging", () => ({
  serviceLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}));

describe("DataImportService", () => {
  const mockUserId = "test-user-123";

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock the transaction to execute the callback immediately
    (db.transaction as ReturnType<typeof vi.fn>).mockImplementation(
      async (
        _mode: string,
        _tables: unknown[],
        callback: () => Promise<void>,
      ) => {
        await callback();
      },
    );
  });

  describe("validateImportData", () => {
    it("should validate valid import data", () => {
      const validData = {
        userId: "user-123",
        sessions: [],
        events: [],
      };

      expect(validateImportData(validData)).toBe(true);
    });

    it("should reject null data", () => {
      expect(validateImportData(null)).toBe(false);
    });

    it("should reject undefined data", () => {
      expect(validateImportData(undefined)).toBe(false);
    });

    it("should reject data without userId", () => {
      const invalidData = {
        sessions: [],
        events: [],
      };

      expect(validateImportData(invalidData)).toBe(false);
    });

    it("should reject data with non-string userId", () => {
      const invalidData = {
        userId: 123,
        sessions: [],
      };

      expect(validateImportData(invalidData)).toBe(false);
    });

    it("should reject non-object data", () => {
      expect(validateImportData("string")).toBe(false);
      expect(validateImportData(123)).toBe(false);
      expect(validateImportData(true)).toBe(false);
    });
  });

  describe("importUserData", () => {
    it("should import valid data from file", async () => {
      const mockData = {
        userId: "backup-user-456",
        sessions: [{ id: "session-1", startTime: new Date() }],
        events: [{ id: "event-1", type: "test" }],
        tasks: [{ id: "task-1", text: "Test task" }],
        goals: [{ id: "goal-1", title: "Test goal" }],
        settings: [{ id: "settings-1", theme: "dark" }],
        rules: [],
      };

      const mockFile = new File([JSON.stringify(mockData)], "backup.json", {
        type: "application/json",
      });

      await importUserData(mockFile, mockUserId);

      // Verify transaction was called
      expect(db.transaction).toHaveBeenCalled();

      // Verify delete operations were called
      expect(db.sessions.where).toHaveBeenCalledWith("userId");
      expect(db.events.where).toHaveBeenCalledWith("userId");
      expect(db.tasks.where).toHaveBeenCalledWith("userId");
      expect(db.goals.where).toHaveBeenCalledWith("userId");
      expect(db.settings.where).toHaveBeenCalledWith("userId");
    });

    it("should reject file with invalid JSON", async () => {
      const mockFile = new File(["invalid json {"], "backup.json", {
        type: "application/json",
      });

      await expect(importUserData(mockFile, mockUserId)).rejects.toThrow();
    });

    it("should reject file without userId", async () => {
      const mockData = {
        sessions: [],
        events: [],
      };

      const mockFile = new File([JSON.stringify(mockData)], "backup.json", {
        type: "application/json",
      });

      await expect(importUserData(mockFile, mockUserId)).rejects.toThrow(
        "Invalid backup file",
      );
    });

    it("should handle empty collections", async () => {
      const mockData = {
        userId: "backup-user-456",
        sessions: [],
        events: [],
        tasks: [],
        goals: [],
        settings: [],
        rules: [],
      };

      const mockFile = new File([JSON.stringify(mockData)], "backup.json", {
        type: "application/json",
      });

      await expect(importUserData(mockFile, mockUserId)).resolves.not.toThrow();
    });

    it("should handle missing optional collections", async () => {
      const mockData = {
        userId: "backup-user-456",
      };

      const mockFile = new File([JSON.stringify(mockData)], "backup.json", {
        type: "application/json",
      });

      await expect(importUserData(mockFile, mockUserId)).resolves.not.toThrow();
    });
  });
});
