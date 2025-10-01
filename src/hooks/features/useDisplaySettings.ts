/**
 * Display Settings Hook - Extracts settings persistence from DisplaySettingsSection
 */

import { useState, useCallback } from "react";
import {
  withErrorHandling,
  handleThemeUpdate,
  handleLanguageUpdate,
  handleDateFormatUpdate,
  handleTimeFormatUpdate,
  handleResetToDefaults,
} from "./display-settings-utils";

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
  const [_previewedSettings, _setPreviewedSettings] =
    useState<Partial<DisplaySettings> | null>(null);

  const updateTheme = useCallback(
    async (theme: "light" | "dark" | "auto"): Promise<void> =>
      withErrorHandling(
        () => handleThemeUpdate(theme, setDisplaySettings),
        setIsUpdating,
        setError,
        "Failed to update theme",
      ),
    [],
  );
  const updateLanguage = useCallback(
    async (language: string): Promise<void> =>
      withErrorHandling(
        () => handleLanguageUpdate(language, setDisplaySettings),
        setIsUpdating,
        setError,
        "Failed to update language",
      ),
    [],
  );
  const updateDateFormat = useCallback(
    async (dateFormat: string): Promise<void> =>
      withErrorHandling(
        () => handleDateFormatUpdate(dateFormat, setDisplaySettings),
        setIsUpdating,
        setError,
        "Failed to update date format",
      ),
    [],
  );
  const updateTimeFormat = useCallback(
    async (timeFormat: "12h" | "24h"): Promise<void> =>
      withErrorHandling(
        () => handleTimeFormatUpdate(timeFormat, setDisplaySettings),
        setIsUpdating,
        setError,
        "Failed to update time format",
      ),
    [],
  );
  const resetToDefaults = useCallback(
    async (): Promise<void> =>
      withErrorHandling(
        () => handleResetToDefaults(defaultSettings, setDisplaySettings),
        setIsUpdating,
        setError,
        "Failed to reset settings",
      ),
    [],
  );
  const previewSettings = useCallback(
    (settings: Partial<DisplaySettings>) => _setPreviewedSettings(settings),
    [],
  );
  const clearPreview = useCallback(() => _setPreviewedSettings(null), []);
  useState(() => setTimeout(() => setIsLoading(false), 100));
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
