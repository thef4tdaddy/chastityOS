/**
 * Display Settings Hook - Extracts settings persistence from DisplaySettingsSection
 */

import { useState, useCallback } from "react";

export interface DisplaySettings {
  theme: "light" | "dark" | "auto";
  language: string;
  dateFormat: string;
  timeFormat: "12h" | "24h";
}

export interface UseDisplaySettingsReturn {
  displaySettings: DisplaySettings;
  isLoading: boolean;
  updateTheme: (theme: "light" | "dark" | "auto") => Promise<void>;
  updateLanguage: (language: string) => Promise<void>;
  updateDateFormat: (format: string) => Promise<void>;
  updateTimeFormat: (format: "12h" | "24h") => Promise<void>;
  resetToDefaults: () => Promise<void>;
  isUpdating: boolean;
  error: Error | null;
  previewSettings: (settings: Partial<DisplaySettings>) => void;
  clearPreview: () => void;
}

const defaultSettings: DisplaySettings = {
  theme: "auto",
  language: "en",
  dateFormat: "MM/DD/YYYY",
  timeFormat: "12h",
};

export function useDisplaySettings(): UseDisplaySettingsReturn {
  const [displaySettings, setDisplaySettings] =
    useState<DisplaySettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [previewedSettings, setPreviewedSettings] =
    useState<Partial<DisplaySettings> | null>(null);

  const updateTheme = useCallback(
    async (theme: "light" | "dark" | "auto"): Promise<void> => {
      setIsUpdating(true);
      setError(null);
      try {
        await new Promise((resolve) => setTimeout(resolve, 100));
        setDisplaySettings((prev) => ({ ...prev, theme }));
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to update theme");
        setError(error);
        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    [],
  );

  const updateLanguage = useCallback(
    async (language: string): Promise<void> => {
      setIsUpdating(true);
      setError(null);
      try {
        await new Promise((resolve) => setTimeout(resolve, 100));
        setDisplaySettings((prev) => ({ ...prev, language }));
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to update language");
        setError(error);
        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    [],
  );

  const updateDateFormat = useCallback(
    async (dateFormat: string): Promise<void> => {
      setIsUpdating(true);
      setError(null);
      try {
        await new Promise((resolve) => setTimeout(resolve, 100));
        setDisplaySettings((prev) => ({ ...prev, dateFormat }));
      } catch (err) {
        const error =
          err instanceof Error
            ? err
            : new Error("Failed to update date format");
        setError(error);
        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    [],
  );

  const updateTimeFormat = useCallback(
    async (timeFormat: "12h" | "24h"): Promise<void> => {
      setIsUpdating(true);
      setError(null);
      try {
        await new Promise((resolve) => setTimeout(resolve, 100));
        setDisplaySettings((prev) => ({ ...prev, timeFormat }));
      } catch (err) {
        const error =
          err instanceof Error
            ? err
            : new Error("Failed to update time format");
        setError(error);
        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    [],
  );

  const resetToDefaults = useCallback(async (): Promise<void> => {
    setIsUpdating(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 100));
      setDisplaySettings(defaultSettings);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to reset settings");
      setError(error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const previewSettings = useCallback((settings: Partial<DisplaySettings>) => {
    setPreviewedSettings(settings);
  }, []);

  const clearPreview = useCallback(() => {
    setPreviewedSettings(null);
  }, []);

  useState(() => {
    setTimeout(() => setIsLoading(false), 100);
  });

  return {
    displaySettings,
    isLoading,
    updateTheme,
    updateLanguage,
    updateDateFormat,
    updateTimeFormat,
    resetToDefaults,
    isUpdating,
    error,
    previewSettings,
    clearPreview,
  };
}
