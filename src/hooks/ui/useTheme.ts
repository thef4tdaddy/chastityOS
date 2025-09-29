/**
 * useTheme Hook - Enhanced Theme Management
 *
 * Advanced theme management beyond basic store functionality, with dynamic themes,
 * user customization, and accessibility features.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Theme,
  CustomTheme,
  CustomThemeDefinition,
  ThemePreferences,
  AccessibilitySettings,
  EnhancedThemeState,
  ThemeCategory,
  FontScale,
  ColorPalette,
} from "../../types/theme";
import { logger } from "../../utils/logging";

// Default themes
const DEFAULT_LIGHT_THEME: Theme = {
  id: "default-light",
  name: "Light",
  category: ThemeCategory.LIGHT,
  colors: {
    primary: "#6366f1",
    secondary: "#8b5cf6",
    accent: "#06b6d4",
    background: "#ffffff",
    surface: "#f8fafc",
    text: "#1e293b",
    textSecondary: "#64748b",
    border: "#e2e8f0",
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
    info: "#3b82f6",
  },
  typography: {
    fontFamily: "Inter, system-ui, sans-serif",
    baseSize: 16,
    lineHeight: 1.5,
    letterSpacing: 0,
  },
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
    xxl: "3rem",
  },
  animations: {
    duration: 200,
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    enabled: true,
  },
  accessibility: {
    highContrast: false,
    reducedMotion: false,
    focusVisible: true,
    screenReader: false,
  },
};

const DEFAULT_DARK_THEME: Theme = {
  ...DEFAULT_LIGHT_THEME,
  id: "default-dark",
  name: "Dark",
  category: ThemeCategory.DARK,
  colors: {
    primary: "#818cf8",
    secondary: "#a78bfa",
    accent: "#22d3ee",
    background: "#0f172a",
    surface: "#1e293b",
    text: "#f1f5f9",
    textSecondary: "#94a3b8",
    border: "#334155",
    success: "#34d399",
    warning: "#fbbf24",
    error: "#f87171",
    info: "#60a5fa",
  },
};

const DEFAULT_THEMES = [DEFAULT_LIGHT_THEME, DEFAULT_DARK_THEME];

// Default preferences
const DEFAULT_PREFERENCES: ThemePreferences = {
  autoSwitch: false,
  lightThemeId: "default-light",
  darkThemeId: "default-dark",
  scheduleEnabled: false,
  lightModeStart: "06:00",
  darkModeStart: "20:00",
  systemSyncEnabled: true,
};

// Default accessibility settings
const DEFAULT_ACCESSIBILITY: AccessibilitySettings = {
  highContrast: false,
  reducedMotion: false,
  fontSize: FontScale.MEDIUM,
  focusOutlines: true,
  screenReaderMode: false,
  keyboardNavigation: true,
};

// Storage keys
const STORAGE_KEYS = {
  CURRENT_THEME: "chastity-theme-current",
  CUSTOM_THEMES: "chastity-theme-custom",
  PREFERENCES: "chastity-theme-preferences",
  ACCESSIBILITY: "chastity-theme-accessibility",
};

/**
 * Enhanced Theme Hook
 */
export const useTheme = () => {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);

  // Get available themes (default + custom)
  const { data: customThemes = [] } = useQuery<CustomTheme[]>({
    queryKey: ["themes", "custom"],
    queryFn: () => {
      const stored = localStorage.getItem(STORAGE_KEYS.CUSTOM_THEMES);
      return stored ? JSON.parse(stored) : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Get theme preferences
  const { data: preferences = DEFAULT_PREFERENCES } =
    useQuery<ThemePreferences>({
      queryKey: ["themes", "preferences"],
      queryFn: () => {
        const stored = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
        return stored
          ? { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) }
          : DEFAULT_PREFERENCES;
      },
      staleTime: 5 * 60 * 1000,
    });

  // Get accessibility settings
  const { data: accessibilitySettings = DEFAULT_ACCESSIBILITY } =
    useQuery<AccessibilitySettings>({
      queryKey: ["themes", "accessibility"],
      queryFn: () => {
        const stored = localStorage.getItem(STORAGE_KEYS.ACCESSIBILITY);
        return stored
          ? { ...DEFAULT_ACCESSIBILITY, ...JSON.parse(stored) }
          : DEFAULT_ACCESSIBILITY;
      },
      staleTime: 5 * 60 * 1000,
    });

  // Get current theme
  const { data: currentTheme = DEFAULT_LIGHT_THEME } = useQuery<Theme>({
    queryKey: ["themes", "current"],
    queryFn: () => {
      const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_THEME);
      if (stored) {
        const themeId = JSON.parse(stored);
        const allThemes = [...DEFAULT_THEMES, ...customThemes];
        return allThemes.find((t) => t.id === themeId) || DEFAULT_LIGHT_THEME;
      }
      return DEFAULT_LIGHT_THEME;
    },
    staleTime: 1000,
  });

  // Combined available themes
  const availableThemes = useMemo(
    () => [...DEFAULT_THEMES, ...customThemes],
    [customThemes],
  );

  // Check if dark mode
  const isDarkMode = useMemo(
    () => currentTheme.category === ThemeCategory.DARK,
    [currentTheme],
  );

  // Set theme mutation
  const setThemeMutation = useMutation({
    mutationFn: async (themeId: string) => {
      const theme = availableThemes.find((t) => t.id === themeId);
      if (!theme) throw new Error("Theme not found");

      localStorage.setItem(STORAGE_KEYS.CURRENT_THEME, JSON.stringify(themeId));
      return theme;
    },
    onSuccess: (theme) => {
      queryClient.setQueryData(["themes", "current"], theme);
      applyThemeToDocument(theme);
      logger.info("Theme changed", {
        themeId: theme.id,
        themeName: theme.name,
      });
    },
  });

  // Create custom theme mutation
  const createCustomThemeMutation = useMutation({
    mutationFn: async (definition: CustomThemeDefinition) => {
      const baseTheme = availableThemes.find(
        (t) => t.id === definition.baseTheme,
      );
      if (!baseTheme) throw new Error("Base theme not found");

      const newTheme: CustomTheme = {
        ...baseTheme,
        ...definition.overrides,
        id: `custom-${Date.now()}`,
        name: definition.name,
        category: ThemeCategory.CUSTOM,
        baseTheme: definition.baseTheme,
        isUserCreated: true,
        createdAt: new Date(),
      };

      const updatedCustomThemes = [...customThemes, newTheme];
      localStorage.setItem(
        STORAGE_KEYS.CUSTOM_THEMES,
        JSON.stringify(updatedCustomThemes),
      );

      return newTheme;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["themes", "custom"] });
      logger.info("Custom theme created");
    },
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (updates: Partial<ThemePreferences>) => {
      const newPreferences = { ...preferences, ...updates };
      localStorage.setItem(
        STORAGE_KEYS.PREFERENCES,
        JSON.stringify(newPreferences),
      );
      return newPreferences;
    },
    onSuccess: (newPreferences) => {
      queryClient.setQueryData(["themes", "preferences"], newPreferences);
      logger.info("Theme preferences updated");
    },
  });

  // Update accessibility settings mutation
  const updateAccessibilityMutation = useMutation({
    mutationFn: async (updates: Partial<AccessibilitySettings>) => {
      const newSettings = { ...accessibilitySettings, ...updates };
      localStorage.setItem(
        STORAGE_KEYS.ACCESSIBILITY,
        JSON.stringify(newSettings),
      );
      return newSettings;
    },
    onSuccess: (newSettings) => {
      queryClient.setQueryData(["themes", "accessibility"], newSettings);
      applyAccessibilitySettings(newSettings);
      logger.info("Accessibility settings updated");
    },
  });

  // Apply theme to document
  const applyThemeToDocument = useCallback((theme: Theme) => {
    const root = document.documentElement;

    // Apply CSS custom properties
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // Apply typography
    root.style.setProperty("--font-family", theme.typography.fontFamily);
    root.style.setProperty(
      "--font-size-base",
      `${theme.typography.baseSize}px`,
    );
    root.style.setProperty(
      "--line-height",
      theme.typography.lineHeight.toString(),
    );
    root.style.setProperty(
      "--letter-spacing",
      `${theme.typography.letterSpacing}px`,
    );

    // Apply spacing
    Object.entries(theme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value);
    });

    // Apply animations
    root.style.setProperty(
      "--animation-duration",
      `${theme.animations.duration}ms`,
    );
    root.style.setProperty("--animation-easing", theme.animations.easing);

    // Set theme class
    root.className = root.className.replace(/theme-\w+/g, "");
    root.classList.add(`theme-${theme.category}`);
  }, []);

  // Apply accessibility settings
  const applyAccessibilitySettings = useCallback(
    (settings: AccessibilitySettings) => {
      const root = document.documentElement;

      // High contrast
      if (settings.highContrast) {
        root.classList.add("high-contrast");
      } else {
        root.classList.remove("high-contrast");
      }

      // Reduced motion
      if (settings.reducedMotion) {
        root.classList.add("reduced-motion");
      } else {
        root.classList.remove("reduced-motion");
      }

      // Font size
      root.classList.remove(
        "font-small",
        "font-medium",
        "font-large",
        "font-extra-large",
      );
      root.classList.add(`font-${settings.fontSize}`);

      // Focus outlines
      if (!settings.focusOutlines) {
        root.classList.add("no-focus-outlines");
      } else {
        root.classList.remove("no-focus-outlines");
      }
    },
    [],
  );

  // Auto theme switching based on time
  useEffect(() => {
    if (!preferences.scheduleEnabled) return;

    const checkSchedule = () => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

      const isLightTime =
        currentTime >= preferences.lightModeStart &&
        currentTime < preferences.darkModeStart;
      const targetThemeId = isLightTime
        ? preferences.lightThemeId
        : preferences.darkThemeId;

      if (currentTheme.id !== targetThemeId) {
        setThemeMutation.mutate(targetThemeId);
      }
    };

    checkSchedule();
    const interval = setInterval(checkSchedule, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [preferences, currentTheme.id]); // Removed setThemeMutation from deps

  // System theme sync
  useEffect(() => {
    if (!preferences.systemSyncEnabled) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      const targetThemeId = e.matches
        ? preferences.darkThemeId
        : preferences.lightThemeId;
      if (currentTheme.id !== targetThemeId) {
        setThemeMutation.mutate(targetThemeId);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [preferences, currentTheme.id]); // Removed setThemeMutation from deps

  // Initialize theme on mount
  useEffect(() => {
    applyThemeToDocument(currentTheme);
    applyAccessibilitySettings(accessibilitySettings);
    setIsLoading(false);
  }, [
    currentTheme,
    accessibilitySettings,
    applyThemeToDocument,
    applyAccessibilitySettings,
  ]);

  // Hook return value
  const state: EnhancedThemeState = {
    currentTheme,
    availableThemes,
    customThemes,
    preferences,
    accessibilitySettings,
    isLoading,
    isDarkMode,
  };

  return {
    // State
    ...state,

    // Theme management
    setTheme: setThemeMutation.mutate,
    createCustomTheme: createCustomThemeMutation.mutate,
    updateThemePreferences: updatePreferencesMutation.mutate,

    // Dynamic theming
    setDynamicColors: useCallback((colors: Partial<ColorPalette>) => {
      const root = document.documentElement;
      Object.entries(colors).forEach(([key, value]) => {
        root.style.setProperty(`--color-${key}`, value);
      });
    }, []),

    enableAutoTheme: useCallback(
      (enabled: boolean) => {
        updatePreferencesMutation.mutate({ systemSyncEnabled: enabled });
      },
      [updatePreferencesMutation],
    ),

    // Accessibility
    updateAccessibilitySettings: updateAccessibilityMutation.mutate,
    enableHighContrast: useCallback(
      (enabled: boolean) => {
        updateAccessibilityMutation.mutate({ highContrast: enabled });
      },
      [updateAccessibilityMutation],
    ),

    setFontSize: useCallback(
      (scale: FontScale) => {
        updateAccessibilityMutation.mutate({ fontSize: scale });
      },
      [updateAccessibilityMutation],
    ),

    // Computed properties
    hasCustomThemes: customThemes.length > 0,
    isHighContrast: accessibilitySettings.highContrast,
    currentFontScale: accessibilitySettings.fontSize,

    // Loading states
    isSettingTheme: setThemeMutation.isPending,
    isCreatingTheme: createCustomThemeMutation.isPending,
    isUpdatingPreferences: updatePreferencesMutation.isPending,
    isUpdatingAccessibility: updateAccessibilityMutation.isPending,
  };
};
