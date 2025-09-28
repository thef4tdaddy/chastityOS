/**
 * UI Preferences Store - Local UI Settings
 * Manages theme, animations, layout settings with localStorage persistence
 */
import React from "react";
import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";

export interface UIPreferencesState {
  // Theme settings
  theme: "light" | "dark";

  // Animation preferences
  animations: boolean;

  // Layout preferences
  compactMode: boolean;
  sidebarCollapsed: boolean;

  // Accessibility preferences
  highContrast: boolean;
  fontSize: "sm" | "md" | "lg";

  // Debug/development preferences
  showDebugInfo: boolean;
  showPerformanceMetrics: boolean;

  // Actions
  setTheme: (theme: "light" | "dark") => void;
  toggleAnimations: () => void;
  setCompactMode: (compact: boolean) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleHighContrast: () => void;
  setFontSize: (size: "sm" | "md" | "lg") => void;
  toggleDebugInfo: () => void;
  togglePerformanceMetrics: () => void;

  // Utility actions
  resetToDefaults: () => void;
  applySystemTheme: () => void;
}

const defaultState = {
  theme: "dark" as const,
  animations: true,
  compactMode: false,
  sidebarCollapsed: false,
  highContrast: false,
  fontSize: "md" as const,
  showDebugInfo: false,
  showPerformanceMetrics: false,
};

export const useUIPreferencesStore = create<UIPreferencesState>()(
  devtools(
    persist(
      (set, _get) => ({
        // Initial state
        ...defaultState,

        // Actions
        setTheme: (theme: "light" | "dark") =>
          set({ theme }, false, "setTheme"),

        toggleAnimations: () =>
          set(
            (state) => ({ animations: !state.animations }),
            false,
            "toggleAnimations",
          ),

        setCompactMode: (compact: boolean) =>
          set({ compactMode: compact }, false, "setCompactMode"),

        toggleSidebar: () =>
          set(
            (state) => ({ sidebarCollapsed: !state.sidebarCollapsed }),
            false,
            "toggleSidebar",
          ),

        setSidebarCollapsed: (collapsed: boolean) =>
          set({ sidebarCollapsed: collapsed }, false, "setSidebarCollapsed"),

        toggleHighContrast: () =>
          set(
            (state) => ({ highContrast: !state.highContrast }),
            false,
            "toggleHighContrast",
          ),

        setFontSize: (size: "sm" | "md" | "lg") =>
          set({ fontSize: size }, false, "setFontSize"),

        toggleDebugInfo: () =>
          set(
            (state) => ({ showDebugInfo: !state.showDebugInfo }),
            false,
            "toggleDebugInfo",
          ),

        togglePerformanceMetrics: () =>
          set(
            (state) => ({
              showPerformanceMetrics: !state.showPerformanceMetrics,
            }),
            false,
            "togglePerformanceMetrics",
          ),

        // Utility actions
        resetToDefaults: () => set(defaultState, false, "resetToDefaults"),

        applySystemTheme: () => {
          const systemPrefersDark = window.matchMedia(
            "(prefers-color-scheme: dark)",
          ).matches;
          set(
            { theme: systemPrefersDark ? "dark" : "light" },
            false,
            "applySystemTheme",
          );
        },
      }),
      {
        name: "ui-preferences", // localStorage key
        // Only persist certain preferences
        partialize: (state) => ({
          theme: state.theme,
          animations: state.animations,
          compactMode: state.compactMode,
          sidebarCollapsed: state.sidebarCollapsed,
          highContrast: state.highContrast,
          fontSize: state.fontSize,
        }),
      },
    ),
    {
      name: "ui-preferences-store",
    },
  ),
);

// Selector hooks for better performance
export const useTheme = () => useUIPreferencesStore((state) => state.theme);

export const useAnimations = () =>
  useUIPreferencesStore((state) => state.animations);

export const useCompactMode = () =>
  useUIPreferencesStore((state) => state.compactMode);

export const useSidebarCollapsed = () =>
  useUIPreferencesStore((state) => state.sidebarCollapsed);

export const useHighContrast = () =>
  useUIPreferencesStore((state) => state.highContrast);

export const useFontSize = () =>
  useUIPreferencesStore((state) => state.fontSize);

export const useShowDebugInfo = () =>
  useUIPreferencesStore((state) => state.showDebugInfo);

export const useShowPerformanceMetrics = () =>
  useUIPreferencesStore((state) => state.showPerformanceMetrics);

// Theme effect hook to apply theme to document
export const useThemeEffect = () => {
  const theme = useTheme();

  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
  }, [theme]);
};

// System theme listener hook
export const useSystemThemeListener = () => {
  const applySystemTheme = useUIPreferencesStore(
    (state) => state.applySystemTheme,
  );

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applySystemTheme();

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [applySystemTheme]);
};
