/**
 * Event Draft Storage Service
 * Handles all event draft localStorage operations
 */

import { logger } from "@/utils/logging";
import type { EventFormData } from "@/hooks/features/useLogEventForm";

// Storage key for event drafts
export const EVENT_DRAFT_STORAGE_KEY = "eventDraft";

/**
 * Event Draft Storage Service
 * Centralizes all event draft localStorage operations
 */
export class EventDraftStorageService {
  /**
   * Save event draft to localStorage
   */
  static saveDraft(formData: EventFormData): void {
    try {
      localStorage.setItem(EVENT_DRAFT_STORAGE_KEY, JSON.stringify(formData));
      logger.debug("Event draft saved", { formData });
    } catch (error) {
      logger.error("Failed to save event draft", { error });
    }
  }

  /**
   * Load event draft from localStorage
   */
  static loadDraft(): EventFormData | null {
    try {
      const draft = localStorage.getItem(EVENT_DRAFT_STORAGE_KEY);
      if (!draft) return null;

      const parsed = JSON.parse(draft);
      logger.debug("Event draft loaded", { draft: parsed });
      return parsed;
    } catch (error) {
      logger.error("Failed to load event draft", { error });
      return null;
    }
  }

  /**
   * Clear event draft from localStorage
   */
  static clearDraft(): void {
    try {
      localStorage.removeItem(EVENT_DRAFT_STORAGE_KEY);
      logger.debug("Event draft cleared");
    } catch (error) {
      logger.error("Failed to clear event draft", { error });
    }
  }

  /**
   * Check if draft exists
   */
  static hasDraft(): boolean {
    try {
      return localStorage.getItem(EVENT_DRAFT_STORAGE_KEY) !== null;
    } catch (error) {
      logger.error("Failed to check for event draft", { error });
      return false;
    }
  }
}
