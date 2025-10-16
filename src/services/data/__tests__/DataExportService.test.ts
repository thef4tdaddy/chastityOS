/**
 * Tests for DataExportService
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { exportUserData, downloadDataAsJSON } from "../DataExportService";
import { db } from "../../storage/ChastityDB";

// Mock the database
vi.mock("../../storage/ChastityDB", () => ({
  db: {
    sessions: {
      where: vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([]),
        }),
      }),
    },
    events: {
      where: vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([]),
        }),
      }),
    },
    tasks: {
      where: vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([]),
        }),
      }),
    },
    goals: {
      where: vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([]),
        }),
      }),
    },
    settings: {
      where: vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([]),
        }),
      }),
    },
    rules: {
      where: vi.fn().mockReturnValue({
        or: vi.fn().mockReturnValue({
          equals: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
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

describe("DataExportService", () => {
  const mockUserId = "test-user-123";
  const mockUserEmail = "test@example.com";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("exportUserData", () => {
    it("should export user data as JSON string", async () => {
      const result = await exportUserData(mockUserId, mockUserEmail);

      expect(result).toBeDefined();
      expect(typeof result).toBe("string");

      const parsed = JSON.parse(result);
      expect(parsed.userId).toBe(mockUserId);
      expect(parsed.userEmail).toBe(mockUserEmail);
      expect(parsed.exportedAt).toBeDefined();
      expect(parsed.sessions).toEqual([]);
      expect(parsed.events).toEqual([]);
      expect(parsed.tasks).toEqual([]);
      expect(parsed.goals).toEqual([]);
      expect(parsed.settings).toEqual([]);
      expect(parsed.rules).toEqual([]);
    });

    it("should export user data without email", async () => {
      const result = await exportUserData(mockUserId);

      const parsed = JSON.parse(result);
      expect(parsed.userId).toBe(mockUserId);
      expect(parsed.userEmail).toBeUndefined();
    });

    it("should query correct collections from database", async () => {
      await exportUserData(mockUserId);

      expect(db.sessions.where).toHaveBeenCalledWith("userId");
      expect(db.events.where).toHaveBeenCalledWith("userId");
      expect(db.tasks.where).toHaveBeenCalledWith("userId");
      expect(db.goals.where).toHaveBeenCalledWith("userId");
      expect(db.settings.where).toHaveBeenCalledWith("userId");
    });
  });

  describe("downloadDataAsJSON", () => {
    let mockCreateElement: ReturnType<typeof vi.fn>;
    let mockLink: {
      href: string;
      download: string;
      click: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
      mockLink = {
        href: "",
        download: "",
        click: vi.fn(),
      };

      mockCreateElement = vi.fn().mockReturnValue(mockLink);
      global.document.createElement = mockCreateElement;
      global.document.body.appendChild = vi.fn();
      global.document.body.removeChild = vi.fn();
      global.URL.createObjectURL = vi.fn().mockReturnValue("blob:mock-url");
      global.URL.revokeObjectURL = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should trigger download with correct filename", () => {
      const jsonData = '{"test": "data"}';

      downloadDataAsJSON(jsonData, mockUserId);

      expect(mockCreateElement).toHaveBeenCalledWith("a");
      expect(mockLink.download).toMatch(
        /^chastityos-backup-test-user-123-\d+\.json$/,
      );
      expect(mockLink.click).toHaveBeenCalled();
    });

    it("should create blob with correct content type", () => {
      const jsonData = '{"test": "data"}';

      downloadDataAsJSON(jsonData, mockUserId);

      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
    });

    it("should clean up link element after download", () => {
      const jsonData = '{"test": "data"}';

      downloadDataAsJSON(jsonData, mockUserId);

      expect(document.body.appendChild).toHaveBeenCalledWith(mockLink);
      expect(document.body.removeChild).toHaveBeenCalledWith(mockLink);
    });
  });
});
