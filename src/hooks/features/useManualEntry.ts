/**
 * Manual Entry Hook - Extracts entry logic from ManualEntryForm component
 */

import { useState, useCallback } from "react";

export interface EntryFormData {
  type: "reward" | "punishment";
  category: string;
  timeValue?: number;
  note?: string;
}

export interface UseManualEntryReturn {
  entryData: EntryFormData;
  setEntryData: (data: Partial<EntryFormData>) => void;
  resetForm: () => void;
  errors: Record<string, string>;
  isValid: boolean;
  submitEntry: (type: "reward" | "punishment") => Promise<void>;
  isSubmitting: boolean;
  error: Error | null;
  rewardCategories: string[];
  punishmentCategories: string[];
}

const defaultEntry: EntryFormData = {
  type: "reward",
  category: "",
};

export function useManualEntry(): UseManualEntryReturn {
  const [entryData, setEntryDataState] = useState<EntryFormData>(defaultEntry);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const setEntryData = useCallback((data: Partial<EntryFormData>) => {
    setEntryDataState((prev) => ({ ...prev, ...data }));
  }, []);

  const resetForm = useCallback(() => {
    setEntryDataState(defaultEntry);
    setErrors({});
  }, []);

  const submitEntry = useCallback(
    async (type: "reward" | "punishment"): Promise<void> => {
      setIsSubmitting(true);
      setError(null);
      try {
        if (!entryData.category) throw new Error("Category is required");
        await new Promise((resolve) => setTimeout(resolve, 100));
        resetForm();
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to submit entry");
        setError(error);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [entryData, resetForm],
  );

  return {
    entryData,
    setEntryData,
    resetForm,
    errors,
    isValid: Object.keys(errors).length === 0,
    submitEntry,
    isSubmitting,
    error,
    rewardCategories: ["Time Reduction", "Orgasm", "Other"],
    punishmentCategories: ["Time Addition", "Task", "Other"],
  };
}
