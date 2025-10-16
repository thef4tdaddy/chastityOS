/**
 * useLogEventForm Tests
 * Comprehensive tests for event form hook
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useLogEventForm } from "../useLogEventForm";
import { EventDraftStorageService } from "../../../services/eventDraftStorage";

// Mock the EventDraftStorageService
vi.mock("../../../services/eventDraftStorage", () => ({
  EventDraftStorageService: {
    saveDraft: vi.fn(),
    loadDraft: vi.fn(),
    clearDraft: vi.fn(),
    hasDraft: vi.fn(),
  },
  EVENT_DRAFT_STORAGE_KEY: "eventDraft",
}));

describe("useLogEventForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Initialization", () => {
    it("should initialize with default state", () => {
      const { result } = renderHook(() => useLogEventForm());

      expect(result.current.formData.type).toBe("");
      expect(result.current.formData.notes).toBe("");
      expect(result.current.formData.timestamp).toBeInstanceOf(Date);
      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.errors).toEqual({});
      expect(result.current.isValid).toBe(true);
    });

    it("should initialize with provided initial data", () => {
      const initialData = {
        type: "SESSION_START",
        notes: "Test notes",
      };

      const { result } = renderHook(() => useLogEventForm(initialData));

      expect(result.current.formData.type).toBe("SESSION_START");
      expect(result.current.formData.notes).toBe("Test notes");
    });

    it("should merge initial data with defaults", () => {
      const initialData = {
        type: "TASK_COMPLETED",
      };

      const { result } = renderHook(() => useLogEventForm(initialData));

      expect(result.current.formData.type).toBe("TASK_COMPLETED");
      expect(result.current.formData.notes).toBe("");
      expect(result.current.formData.timestamp).toBeInstanceOf(Date);
    });
  });

  describe("Form Data Management", () => {
    it("should update form data", () => {
      const { result } = renderHook(() => useLogEventForm());

      act(() => {
        result.current.setFormData({ type: "SESSION_START" });
      });

      expect(result.current.formData.type).toBe("SESSION_START");
    });

    it("should update multiple fields at once", () => {
      const { result } = renderHook(() => useLogEventForm());

      act(() => {
        result.current.setFormData({
          type: "TASK_COMPLETED",
          notes: "Task finished successfully",
          category: "Work",
        });
      });

      expect(result.current.formData.type).toBe("TASK_COMPLETED");
      expect(result.current.formData.notes).toBe("Task finished successfully");
      expect(result.current.formData.category).toBe("Work");
    });

    it("should preserve existing data when updating", () => {
      const { result } = renderHook(() => useLogEventForm());

      act(() => {
        result.current.setFormData({ type: "SESSION_START" });
      });

      act(() => {
        result.current.setFormData({ notes: "New notes" });
      });

      expect(result.current.formData.type).toBe("SESSION_START");
      expect(result.current.formData.notes).toBe("New notes");
    });

    it("should reset form to default state", () => {
      const { result } = renderHook(() => useLogEventForm());

      act(() => {
        result.current.setFormData({
          type: "SESSION_START",
          notes: "Test notes",
        });
      });

      act(() => {
        result.current.resetForm();
      });

      expect(result.current.formData.type).toBe("");
      expect(result.current.formData.notes).toBe("");
      expect(result.current.errors).toEqual({});
    });
  });

  describe("Validation", () => {
    it("should validate required type field", () => {
      const { result } = renderHook(() => useLogEventForm());

      act(() => {
        result.current.validate();
      });

      expect(result.current.errors.type).toBe("Event type is required");
      expect(result.current.isValid).toBe(false);
    });

    it("should pass validation when type is provided", () => {
      const { result } = renderHook(() => useLogEventForm());

      act(() => {
        result.current.setFormData({ type: "SESSION_START" });
      });

      let isValid: boolean;
      act(() => {
        isValid = result.current.validate();
      });

      expect(isValid!).toBe(true);
      expect(result.current.errors).toEqual({});
      expect(result.current.isValid).toBe(true);
    });

    it("should clear errors when validation passes", () => {
      const { result } = renderHook(() => useLogEventForm());

      // First validation fails
      act(() => {
        result.current.validate();
      });
      expect(result.current.errors.type).toBeDefined();

      // Add type
      act(() => {
        result.current.setFormData({ type: "SESSION_START" });
      });

      // Validate again
      act(() => {
        result.current.validate();
      });

      expect(result.current.errors).toEqual({});
      expect(result.current.isValid).toBe(true);
    });
  });

  describe("Form Submission", () => {
    it("should submit valid form data", async () => {
      const { result } = renderHook(() => useLogEventForm());

      act(() => {
        result.current.setFormData({ type: "SESSION_START" });
      });

      await act(async () => {
        await result.current.submitEvent();
      });

      expect(result.current.submitError).toBeNull();
    });

    it("should set isSubmitting during submission", async () => {
      const { result } = renderHook(() => useLogEventForm());

      act(() => {
        result.current.setFormData({ type: "SESSION_START" });
      });

      let submissionPromise: Promise<void>;
      act(() => {
        submissionPromise = result.current.submitEvent();
      });

      expect(result.current.isSubmitting).toBe(true);

      await act(async () => {
        await submissionPromise;
      });

      expect(result.current.isSubmitting).toBe(false);
    });

    it("should reset form after successful submission", async () => {
      const { result } = renderHook(() => useLogEventForm());

      act(() => {
        result.current.setFormData({
          type: "SESSION_START",
          notes: "Test notes",
        });
      });

      await act(async () => {
        await result.current.submitEvent();
      });

      expect(result.current.formData.type).toBe("");
      expect(result.current.formData.notes).toBe("");
    });

    it("should fail validation on submit when type is missing", async () => {
      const { result } = renderHook(() => useLogEventForm());

      await act(async () => {
        try {
          await result.current.submitEvent();
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBe("Validation failed");
        }
      });

      expect(result.current.submitError).not.toBeNull();
    });

    it("should set submitError on failed submission", async () => {
      const { result } = renderHook(() => useLogEventForm());

      await act(async () => {
        try {
          await result.current.submitEvent();
        } catch {
          // Expected error
        }
      });

      expect(result.current.submitError).toBeInstanceOf(Error);
    });
  });

  describe("Draft Management", () => {
    it("should save draft", () => {
      const { result } = renderHook(() => useLogEventForm());

      // First update the form data
      act(() => {
        result.current.setFormData({
          type: "SESSION_START",
          notes: "Draft notes",
        });
      });

      // Then save the draft
      act(() => {
        result.current.saveDraft();
      });

      expect(EventDraftStorageService.saveDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "SESSION_START",
          notes: "Draft notes",
        }),
      );
      expect(result.current.hasDraft).toBe(true);
    });

    it("should load draft", () => {
      const mockDraft = {
        type: "TASK_COMPLETED",
        notes: "Loaded notes",
        timestamp: new Date(),
      };

      vi.mocked(EventDraftStorageService.loadDraft).mockReturnValue(mockDraft);

      const { result } = renderHook(() => useLogEventForm());

      act(() => {
        result.current.loadDraft();
      });

      expect(result.current.formData.type).toBe("TASK_COMPLETED");
      expect(result.current.formData.notes).toBe("Loaded notes");
    });

    it("should clear draft", () => {
      const { result } = renderHook(() => useLogEventForm());

      act(() => {
        result.current.setFormData({ type: "SESSION_START" });
        result.current.saveDraft();
      });

      act(() => {
        result.current.clearDraft();
      });

      expect(EventDraftStorageService.clearDraft).toHaveBeenCalled();
      expect(result.current.hasDraft).toBe(false);
    });

    it("should handle null draft when loading", () => {
      vi.mocked(EventDraftStorageService.loadDraft).mockReturnValue(null);

      const { result } = renderHook(() => useLogEventForm());

      const initialType = result.current.formData.type;

      act(() => {
        result.current.loadDraft();
      });

      // Should not change form data if draft is null
      expect(result.current.formData.type).toBe(initialType);
    });
  });

  describe("Helper Data", () => {
    it("should provide category suggestions", () => {
      const { result } = renderHook(() => useLogEventForm());

      expect(result.current.categorySuggestions).toBeInstanceOf(Array);
      expect(result.current.categorySuggestions.length).toBeGreaterThan(0);
    });

    it("should provide recent events", () => {
      const { result } = renderHook(() => useLogEventForm());

      expect(result.current.recentEvents).toBeInstanceOf(Array);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty string type as invalid", () => {
      const { result } = renderHook(() => useLogEventForm());

      act(() => {
        result.current.setFormData({ type: "" });
        result.current.validate();
      });

      expect(result.current.errors.type).toBeDefined();
    });

    it("should handle very long notes", () => {
      const { result } = renderHook(() => useLogEventForm());
      const longNotes = "a".repeat(10000);

      act(() => {
        result.current.setFormData({ notes: longNotes });
      });

      expect(result.current.formData.notes).toBe(longNotes);
    });

    it("should handle special characters in notes", () => {
      const { result } = renderHook(() => useLogEventForm());
      const specialNotes = "Test \"quotes\" and 'apostrophes' with \n newlines";

      act(() => {
        result.current.setFormData({ notes: specialNotes });
      });

      expect(result.current.formData.notes).toBe(specialNotes);
    });

    it("should handle undefined timestamp", () => {
      const { result } = renderHook(() => useLogEventForm());

      // Check if default timestamp is set (it may not be based on implementation)
      // The useLogEventForm implementation sets timestamp: new Date() in defaultFormData
      expect(result.current.formData.timestamp).toBeDefined();
      expect(result.current.formData.timestamp).toBeInstanceOf(Date);
    });
  });
});
