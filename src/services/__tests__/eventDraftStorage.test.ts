/**
 * EventDraftStorageService Tests
 * Tests for event draft localStorage operations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  EventDraftStorageService,
  EVENT_DRAFT_STORAGE_KEY,
} from "../eventDraftStorage";
import type { EventFormData } from "@/hooks/features/useLogEventForm";

describe("EventDraftStorageService", () => {
  const mockFormData: EventFormData = {
    type: "SESSION_START",
    notes: "Test event notes",
    timestamp: new Date("2024-01-01T10:00:00Z"),
    category: "Session",
  };

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("saveDraft", () => {
    it("should save draft to localStorage", () => {
      EventDraftStorageService.saveDraft(mockFormData);

      const saved = localStorage.getItem(EVENT_DRAFT_STORAGE_KEY);
      expect(saved).not.toBeNull();

      const parsed = JSON.parse(saved!);
      expect(parsed.type).toBe("SESSION_START");
      expect(parsed.notes).toBe("Test event notes");
    });

    it("should overwrite existing draft", () => {
      EventDraftStorageService.saveDraft(mockFormData);

      const newFormData: EventFormData = {
        type: "TASK_COMPLETED",
        notes: "Updated notes",
        timestamp: new Date(),
      };
      EventDraftStorageService.saveDraft(newFormData);

      const saved = localStorage.getItem(EVENT_DRAFT_STORAGE_KEY);
      const parsed = JSON.parse(saved!);
      expect(parsed.type).toBe("TASK_COMPLETED");
      expect(parsed.notes).toBe("Updated notes");
    });

    it("should handle form data with all fields", () => {
      const completeFormData: EventFormData = {
        type: "SESSION_START",
        notes: "Complete notes",
        timestamp: new Date("2024-01-01T10:00:00Z"),
        category: "Session",
      };

      EventDraftStorageService.saveDraft(completeFormData);

      const saved = localStorage.getItem(EVENT_DRAFT_STORAGE_KEY);
      const parsed = JSON.parse(saved!);
      expect(parsed).toMatchObject({
        type: "SESSION_START",
        notes: "Complete notes",
        category: "Session",
      });
    });

    it("should handle form data with minimal fields", () => {
      const minimalFormData: EventFormData = {
        type: "TASK_COMPLETED",
      };

      EventDraftStorageService.saveDraft(minimalFormData);

      const saved = localStorage.getItem(EVENT_DRAFT_STORAGE_KEY);
      const parsed = JSON.parse(saved!);
      expect(parsed.type).toBe("TASK_COMPLETED");
    });

    it("should handle errors when localStorage is full", () => {
      // Mock localStorage.setItem to throw an error
      const setItemSpy = vi
        .spyOn(Storage.prototype, "setItem")
        .mockImplementation(() => {
          throw new Error("QuotaExceededError");
        });

      // Should not throw, but log error internally
      expect(() => {
        EventDraftStorageService.saveDraft(mockFormData);
      }).not.toThrow();

      setItemSpy.mockRestore();
    });
  });

  describe("loadDraft", () => {
    it("should load draft from localStorage", () => {
      localStorage.setItem(
        EVENT_DRAFT_STORAGE_KEY,
        JSON.stringify(mockFormData),
      );

      const loaded = EventDraftStorageService.loadDraft();

      expect(loaded).not.toBeNull();
      expect(loaded?.type).toBe("SESSION_START");
      expect(loaded?.notes).toBe("Test event notes");
    });

    it("should return null when no draft exists", () => {
      const loaded = EventDraftStorageService.loadDraft();

      expect(loaded).toBeNull();
    });

    it("should return null when draft is invalid JSON", () => {
      localStorage.setItem(EVENT_DRAFT_STORAGE_KEY, "invalid-json{");

      const loaded = EventDraftStorageService.loadDraft();

      expect(loaded).toBeNull();
    });

    it("should handle corrupted data gracefully", () => {
      localStorage.setItem(EVENT_DRAFT_STORAGE_KEY, "null");

      const loaded = EventDraftStorageService.loadDraft();

      expect(loaded).toBeNull();
    });

    it("should parse Date objects correctly", () => {
      const formDataWithDate = {
        ...mockFormData,
        timestamp: new Date("2024-06-15T14:30:00Z"),
      };

      localStorage.setItem(
        EVENT_DRAFT_STORAGE_KEY,
        JSON.stringify(formDataWithDate),
      );

      const loaded = EventDraftStorageService.loadDraft();

      expect(loaded).not.toBeNull();
      expect(loaded?.timestamp).toBeDefined();
    });
  });

  describe("clearDraft", () => {
    it("should clear draft from localStorage", () => {
      localStorage.setItem(
        EVENT_DRAFT_STORAGE_KEY,
        JSON.stringify(mockFormData),
      );

      EventDraftStorageService.clearDraft();

      const saved = localStorage.getItem(EVENT_DRAFT_STORAGE_KEY);
      expect(saved).toBeNull();
    });

    it("should not throw when clearing non-existent draft", () => {
      expect(() => {
        EventDraftStorageService.clearDraft();
      }).not.toThrow();
    });

    it("should handle errors when localStorage is unavailable", () => {
      const removeItemSpy = vi
        .spyOn(Storage.prototype, "removeItem")
        .mockImplementation(() => {
          throw new Error("localStorage unavailable");
        });

      // Should not throw
      expect(() => {
        EventDraftStorageService.clearDraft();
      }).not.toThrow();

      removeItemSpy.mockRestore();
    });
  });

  describe("hasDraft", () => {
    it("should return true when draft exists", () => {
      localStorage.setItem(
        EVENT_DRAFT_STORAGE_KEY,
        JSON.stringify(mockFormData),
      );

      const result = EventDraftStorageService.hasDraft();

      expect(result).toBe(true);
    });

    it("should return false when no draft exists", () => {
      const result = EventDraftStorageService.hasDraft();

      expect(result).toBe(false);
    });

    it("should return true even for invalid JSON", () => {
      localStorage.setItem(EVENT_DRAFT_STORAGE_KEY, "invalid-json{");

      const result = EventDraftStorageService.hasDraft();

      // hasDraft only checks if item exists, not if it's valid
      expect(result).toBe(true);
    });

    it("should handle errors when localStorage is unavailable", () => {
      const getItemSpy = vi
        .spyOn(Storage.prototype, "getItem")
        .mockImplementation(() => {
          throw new Error("localStorage unavailable");
        });

      const result = EventDraftStorageService.hasDraft();

      expect(result).toBe(false);

      getItemSpy.mockRestore();
    });
  });

  describe("Integration scenarios", () => {
    it("should save, load, and clear draft in sequence", () => {
      // Save
      EventDraftStorageService.saveDraft(mockFormData);
      expect(EventDraftStorageService.hasDraft()).toBe(true);

      // Load
      const loaded = EventDraftStorageService.loadDraft();
      expect(loaded?.type).toBe("SESSION_START");

      // Clear
      EventDraftStorageService.clearDraft();
      expect(EventDraftStorageService.hasDraft()).toBe(false);
    });

    it("should handle multiple save operations", () => {
      EventDraftStorageService.saveDraft(mockFormData);

      const updated: EventFormData = {
        type: "TASK_COMPLETED",
        notes: "Updated",
      };
      EventDraftStorageService.saveDraft(updated);

      const loaded = EventDraftStorageService.loadDraft();
      expect(loaded?.type).toBe("TASK_COMPLETED");
      expect(loaded?.notes).toBe("Updated");
    });

    it("should maintain draft across multiple checks", () => {
      EventDraftStorageService.saveDraft(mockFormData);

      expect(EventDraftStorageService.hasDraft()).toBe(true);
      expect(EventDraftStorageService.hasDraft()).toBe(true);
      expect(EventDraftStorageService.hasDraft()).toBe(true);

      const loaded = EventDraftStorageService.loadDraft();
      expect(loaded?.type).toBe("SESSION_START");
    });
  });

  describe("Edge cases", () => {
    it("should handle empty string notes", () => {
      const formData: EventFormData = {
        type: "SESSION_START",
        notes: "",
      };

      EventDraftStorageService.saveDraft(formData);
      const loaded = EventDraftStorageService.loadDraft();

      expect(loaded?.notes).toBe("");
    });

    it("should handle very long notes", () => {
      const longNotes = "a".repeat(10000);
      const formData: EventFormData = {
        type: "SESSION_START",
        notes: longNotes,
      };

      EventDraftStorageService.saveDraft(formData);
      const loaded = EventDraftStorageService.loadDraft();

      expect(loaded?.notes).toBe(longNotes);
    });

    it("should handle special characters in notes", () => {
      const formData: EventFormData = {
        type: "SESSION_START",
        notes: "Special chars: \"quotes\", 'apostrophes', \n newlines, \t tabs",
      };

      EventDraftStorageService.saveDraft(formData);
      const loaded = EventDraftStorageService.loadDraft();

      expect(loaded?.notes).toBe(formData.notes);
    });

    it("should handle undefined optional fields", () => {
      const formData: EventFormData = {
        type: "SESSION_START",
        notes: undefined,
        timestamp: undefined,
        category: undefined,
      };

      EventDraftStorageService.saveDraft(formData);
      const loaded = EventDraftStorageService.loadDraft();

      expect(loaded?.type).toBe("SESSION_START");
      expect(loaded?.notes).toBeUndefined();
    });
  });
});
