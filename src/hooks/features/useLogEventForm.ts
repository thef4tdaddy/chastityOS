/**
 * Log Event Form Hook
 *
 * Extracts form submission logic from LogEventForm component.
 */

import { useState, useCallback } from "react";

export interface EventFormData {
  type: string;
  notes?: string;
  timestamp?: Date;
  category?: string;
}

export interface UseLogEventFormReturn {
  formData: EventFormData;
  setFormData: (data: Partial<EventFormData>) => void;
  resetForm: () => void;
  errors: Record<string, string>;
  isValid: boolean;
  validate: () => boolean;
  submitEvent: () => Promise<void>;
  isSubmitting: boolean;
  submitError: Error | null;
  saveDraft: () => void;
  loadDraft: () => void;
  hasDraft: boolean;
  clearDraft: () => void;
  categorySuggestions: string[];
  recentEvents: any[];
}

const defaultFormData: EventFormData = {
  type: "",
  notes: "",
  timestamp: new Date(),
};

export function useLogEventForm(
  initialData?: Partial<EventFormData>,
): UseLogEventFormReturn {
  const [formData, setFormDataState] = useState<EventFormData>({
    ...defaultFormData,
    ...initialData,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<Error | null>(null);
  const [hasDraft, setHasDraft] = useState(false);

  const setFormData = useCallback((data: Partial<EventFormData>) => {
    setFormDataState((prev) => ({ ...prev, ...data }));
  }, []);

  const resetForm = useCallback(() => {
    setFormDataState(defaultFormData);
    setErrors({});
  }, []);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.type) {
      newErrors.type = "Event type is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const submitEvent = useCallback(async (): Promise<void> => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (!validate()) {
        throw new Error("Validation failed");
      }

      // Mock submission
      await new Promise((resolve) => setTimeout(resolve, 100));
      resetForm();
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to submit event");
      setSubmitError(error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [validate, resetForm]);

  const saveDraft = useCallback(() => {
    localStorage.setItem("eventDraft", JSON.stringify(formData));
    setHasDraft(true);
  }, [formData]);

  const loadDraft = useCallback(() => {
    const draft = localStorage.getItem("eventDraft");
    if (draft) {
      setFormDataState(JSON.parse(draft));
    }
  }, []);

  const clearDraft = useCallback(() => {
    localStorage.removeItem("eventDraft");
    setHasDraft(false);
  }, []);

  return {
    formData,
    setFormData,
    resetForm,
    errors,
    isValid: Object.keys(errors).length === 0,
    validate,
    submitEvent,
    isSubmitting,
    submitError,
    saveDraft,
    loadDraft,
    hasDraft,
    clearDraft,
    categorySuggestions: ["Orgasm", "Edge", "Release", "Lock"],
    recentEvents: [],
  };
}
