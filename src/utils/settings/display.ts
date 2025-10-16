/**
 * Display Settings Utils - Helper functions for useDisplaySettings
 */

import { type Dispatch, type SetStateAction } from "react";
import type { DisplaySettings } from "../../hooks/features/useDisplaySettings";

type AsyncHandler<T = void> = () => Promise<T>;

export const withErrorHandling = async <T>(
  handler: AsyncHandler<T>,
  setIsUpdating: (v: boolean) => void,
  setError: (e: Error | null) => void,
  errorMessage: string,
): Promise<T> => {
  setIsUpdating(true);
  setError(null);
  try {
    return await handler();
  } catch (err) {
    const error = err instanceof Error ? err : new Error(errorMessage);
    setError(error);
    throw error;
  } finally {
    setIsUpdating(false);
  }
};

export const handleThemeUpdate = async (
  theme: "light" | "dark" | "auto",
  setSettings: Dispatch<SetStateAction<DisplaySettings>>,
): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  setSettings((prev) => ({ ...prev, theme }));
};

export const handleLanguageUpdate = async (
  language: string,
  setSettings: Dispatch<SetStateAction<DisplaySettings>>,
): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  setSettings((prev) => ({ ...prev, language }));
};

export const handleDateFormatUpdate = async (
  dateFormat: string,
  setSettings: Dispatch<SetStateAction<DisplaySettings>>,
): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  setSettings((prev) => ({ ...prev, dateFormat }));
};

export const handleTimeFormatUpdate = async (
  timeFormat: "12h" | "24h",
  setSettings: Dispatch<SetStateAction<DisplaySettings>>,
): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  setSettings((prev) => ({ ...prev, timeFormat }));
};

export const handleResetToDefaults = async (
  defaultSettings: DisplaySettings,
  setSettings: Dispatch<SetStateAction<DisplaySettings>>,
): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  setSettings(defaultSettings);
};
