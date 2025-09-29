/**
 * Theme Store
 * UI state management for theme preferences, animations, and layout settings
 * Zustand store - handles theme and UI preference state
 */
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { serviceLogger } from "@/utils/logging";

const logger = serviceLogger("ThemeStore");

export type ThemeMode = "light" | "dark" | "system";
export type ColorScheme = "nightly" | "classic" | "high-contrast";
export type FontSize = "sm" | "md" | "lg" | "xl";
export type AnimationSpeed = "none" | "reduced" | "normal" | "fast";

export interface ThemeState {
  // Theme settings
  mode: ThemeMode;
  colorScheme: ColorScheme;

  // Typography
  fontSize: FontSize;

  // Animations and motion
  animationSpeed: AnimationSpeed;
  reduceMotion: boolean;

  // Layout preferences
  compactMode: boolean;
  showSidebar: boolean;
  sidebarCollapsed: boolean;

  // Accessibility
  highContrast: boolean;
  focusIndicators: boolean;

  // UI preferences
  showTooltips: boolean;
  showHints: boolean;
  autoSave: boolean;

  // System detection
  systemPrefersDark: boolean;
  systemPrefersReducedMotion: boolean;
}

export interface ThemeActions {
  // Theme management
  setMode: (mode: ThemeMode) => void;
  setColorScheme: (scheme: ColorScheme) => void;
  toggleMode: () => void;

  // Typography
  setFontSize: (size: FontSize) => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;

  // Animations and motion
  setAnimationSpeed: (speed: AnimationSpeed) => void;
  setReduceMotion: (reduce: boolean) => void;
  toggleReduceMotion: () => void;

  // Layout preferences
  setCompactMode: (compact: boolean) => void;
  toggleCompactMode: () => void;
  setShowSidebar: (show: boolean) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapse: () => void;

  // Accessibility
  setHighContrast: (enabled: boolean) => void;
  toggleHighContrast: () => void;
  setFocusIndicators: (enabled: boolean) => void;
  toggleFocusIndicators: () => void;

  // UI preferences
  setShowTooltips: (show: boolean) => void;
  toggleTooltips: () => void;
  setShowHints: (show: boolean) => void;
  toggleHints: () => void;
  setAutoSave: (enabled: boolean) => void;
  toggleAutoSave: () => void;

  // System detection
  updateSystemPreferences: () => void;

  // Computed getters
  getEffectiveMode: () => "light" | "dark";
  getEffectiveAnimationSpeed: () => AnimationSpeed;
  shouldReduceMotion: () => boolean;

  // Presets
  applyPreset: (
    preset: "default" | "minimal" | "accessible" | "performance",
  ) => void;

  // Reset
  resetToDefaults: () => void;
  resetStore: () => void;
}

export interface ThemeStore extends ThemeState, ThemeActions {}

const defaultState: ThemeState = {
  mode: "system",
  colorScheme: "nightly",
  fontSize: "md",
  animationSpeed: "normal",
  reduceMotion: false,
  compactMode: false,
  showSidebar: true,
  sidebarCollapsed: false,
  highContrast: false,
  focusIndicators: true,
  showTooltips: true,
  showHints: true,
  autoSave: true,
  systemPrefersDark: false,
  systemPrefersReducedMotion: false,
};

// Helper functions
const detectSystemPreferences = () => {
  if (typeof window === "undefined") {
    return { dark: false, reducedMotion: false };
  }

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  return { dark: prefersDark, reducedMotion: prefersReducedMotion };
};

const fontSizeOrder: FontSize[] = ["sm", "md", "lg", "xl"];

// Helper functions for different action categories
const createThemeActions = (
  set: (
    state: Partial<ThemeStore> | ((state: ThemeStore) => ThemeStore),
  ) => void,
  get: () => ThemeStore,
) => ({
  setMode: (mode: ThemeMode) => {
    set({ mode });
    logger.debug("Theme mode set", { mode });

    // Apply theme class to document
    if (typeof document !== "undefined") {
      const effectiveMode = get().getEffectiveMode();
      document.documentElement.classList.toggle(
        "dark",
        effectiveMode === "dark",
      );
    }
  },

  setColorScheme: (scheme: ColorScheme) => {
    set({ colorScheme: scheme });
    logger.debug("Color scheme set", { scheme });

    // Apply color scheme class to document
    if (typeof document !== "undefined") {
      document.documentElement.className = document.documentElement.className
        .replace(/scheme-\w+/g, "")
        .concat(` scheme-${scheme}`);
    }
  },

  toggleMode: () => {
    const { mode } = get();
    const newMode: ThemeMode =
      mode === "light" ? "dark" : mode === "dark" ? "system" : "light";
    get().setMode(newMode);
  },
});

const createTypographyActions = (
  set: (
    state: Partial<ThemeStore> | ((state: ThemeStore) => ThemeStore),
  ) => void,
  get: () => ThemeStore,
) => ({
  setFontSize: (size: FontSize) => {
    set({ fontSize: size });
    logger.debug("Font size set", { size });

    // Apply font size class to document
    if (typeof document !== "undefined") {
      document.documentElement.className = document.documentElement.className
        .replace(/text-size-\w+/g, "")
        .concat(` text-size-${size}`);
    }
  },

  increaseFontSize: () => {
    const { fontSize } = get();
    const currentIndex = fontSizeOrder.indexOf(fontSize);
    if (currentIndex < fontSizeOrder.length - 1) {
      const newSize = fontSizeOrder[currentIndex + 1];
      if (newSize) {
        get().setFontSize(newSize);
      }
    }
  },

  decreaseFontSize: () => {
    const { fontSize } = get();
    const currentIndex = fontSizeOrder.indexOf(fontSize);
    if (currentIndex > 0) {
      const newSize = fontSizeOrder[currentIndex - 1];
      if (newSize) {
        get().setFontSize(newSize);
      }
    }
  },
});

const createAnimationActions = (
  set: (
    state: Partial<ThemeStore> | ((state: ThemeStore) => ThemeStore),
  ) => void,
  get: () => ThemeStore,
) => ({
  setAnimationSpeed: (speed: AnimationSpeed) => {
    set({ animationSpeed: speed });
    logger.debug("Animation speed set", { speed });
  },

  setReduceMotion: (reduce: boolean) => {
    set({ reduceMotion: reduce });
    logger.debug("Reduce motion set", { reduce });
  },

  toggleReduceMotion: () => {
    const { reduceMotion } = get();
    get().setReduceMotion(!reduceMotion);
  },
});

const createLayoutActions = (
  set: (
    state: Partial<ThemeStore> | ((state: ThemeStore) => ThemeStore),
  ) => void,
  get: () => ThemeStore,
) => ({
  setCompactMode: (compact: boolean) => {
    set({ compactMode: compact });
    logger.debug("Compact mode set", { compact });
  },

  toggleCompactMode: () => {
    const { compactMode } = get();
    get().setCompactMode(!compactMode);
  },

  setShowSidebar: (show: boolean) => {
    set({ showSidebar: show });
    logger.debug("Show sidebar set", { show });
  },

  toggleSidebar: () => {
    const { showSidebar } = get();
    get().setShowSidebar(!showSidebar);
  },

  setSidebarCollapsed: (collapsed: boolean) => {
    set({ sidebarCollapsed: collapsed });
    logger.debug("Sidebar collapsed set", { collapsed });
  },

  toggleSidebarCollapse: () => {
    const { sidebarCollapsed } = get();
    get().setSidebarCollapsed(!sidebarCollapsed);
  },
});

const createAccessibilityActions = (
  set: (
    state: Partial<ThemeStore> | ((state: ThemeStore) => ThemeStore),
  ) => void,
  get: () => ThemeStore,
) => ({
  setHighContrast: (enabled: boolean) => {
    set({ highContrast: enabled });
    logger.debug("High contrast set", { enabled });

    // Apply high contrast class to document
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("high-contrast", enabled);
    }
  },

  toggleHighContrast: () => {
    const { highContrast } = get();
    get().setHighContrast(!highContrast);
  },

  setFocusIndicators: (enabled: boolean) => {
    set({ focusIndicators: enabled });
    logger.debug("Focus indicators set", { enabled });
  },

  toggleFocusIndicators: () => {
    const { focusIndicators } = get();
    get().setFocusIndicators(!focusIndicators);
  },
});

const createUIPreferenceActions = (
  set: (
    state: Partial<ThemeStore> | ((state: ThemeStore) => ThemeStore),
  ) => void,
  get: () => ThemeStore,
) => ({
  setShowTooltips: (show: boolean) => {
    set({ showTooltips: show });
    logger.debug("Show tooltips set", { show });
  },

  toggleTooltips: () => {
    const { showTooltips } = get();
    get().setShowTooltips(!showTooltips);
  },

  setShowHints: (show: boolean) => {
    set({ showHints: show });
    logger.debug("Show hints set", { show });
  },

  toggleHints: () => {
    const { showHints } = get();
    get().setShowHints(!showHints);
  },

  setAutoSave: (enabled: boolean) => {
    set({ autoSave: enabled });
    logger.debug("Auto save set", { enabled });
  },

  toggleAutoSave: () => {
    const { autoSave } = get();
    get().setAutoSave(!autoSave);
  },
});

const createSystemActions = (
  set: (
    state: Partial<ThemeStore> | ((state: ThemeStore) => ThemeStore),
  ) => void,
  get: () => ThemeStore,
) => ({
  updateSystemPreferences: () => {
    const { dark, reducedMotion } = detectSystemPreferences();

    set({
      systemPrefersDark: dark,
      systemPrefersReducedMotion: reducedMotion,
    });

    logger.debug("System preferences updated", { dark, reducedMotion });

    // Update effective mode if using system preference
    const { mode } = get();
    if (mode === "system") {
      get().setMode("system"); // Triggers re-application of theme
    }
  },
});

const createComputedGetters = (get: () => ThemeStore) => ({
  getEffectiveMode: () => {
    const { mode, systemPrefersDark } = get();
    if (mode === "system") {
      return systemPrefersDark ? "dark" : "light";
    }
    return mode;
  },

  getEffectiveAnimationSpeed: () => {
    const { animationSpeed, systemPrefersReducedMotion } = get();
    if (systemPrefersReducedMotion) {
      return "none";
    }
    return animationSpeed;
  },

  shouldReduceMotion: () => {
    const { reduceMotion, systemPrefersReducedMotion } = get();
    return reduceMotion || systemPrefersReducedMotion;
  },
});

const createPresetActions = (
  set: (
    state: Partial<ThemeStore> | ((state: ThemeStore) => ThemeStore),
  ) => void,
) => ({
  applyPreset: (
    preset: "default" | "minimal" | "accessible" | "performance",
  ) => {
    const presets = {
      default: { ...defaultState },
      minimal: {
        ...defaultState,
        showTooltips: false,
        showHints: false,
        animationSpeed: "reduced" as AnimationSpeed,
        compactMode: true,
      },
      accessible: {
        ...defaultState,
        highContrast: true,
        focusIndicators: true,
        fontSize: "lg" as FontSize,
        reduceMotion: true,
        animationSpeed: "none" as AnimationSpeed,
      },
      performance: {
        ...defaultState,
        animationSpeed: "none" as AnimationSpeed,
        reduceMotion: true,
        showTooltips: false,
        autoSave: false,
      },
    };

    const presetConfig = presets[preset];
    set(presetConfig);
    logger.info("Theme preset applied", { preset });
  },

  resetToDefaults: () => {
    set(defaultState);
    logger.info("Theme reset to defaults");
  },

  resetStore: () => {
    set(defaultState);
    logger.debug("Theme store reset to initial state");
  },
});

export const useThemeStore = create<ThemeStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...defaultState,
        ...createThemeActions(set, get),
        ...createTypographyActions(set, get),
        ...createAnimationActions(set, get),
        ...createLayoutActions(set, get),
        ...createAccessibilityActions(set, get),
        ...createUIPreferenceActions(set, get),
        ...createSystemActions(set, get),
        ...createComputedGetters(get),
        ...createPresetActions(set),
      }),
      {
        name: "theme-store",
        // Only persist certain settings
        partialize: (state) => ({
          mode: state.mode,
          colorScheme: state.colorScheme,
          fontSize: state.fontSize,
          animationSpeed: state.animationSpeed,
          reduceMotion: state.reduceMotion,
          compactMode: state.compactMode,
          showSidebar: state.showSidebar,
          sidebarCollapsed: state.sidebarCollapsed,
          highContrast: state.highContrast,
          focusIndicators: state.focusIndicators,
          showTooltips: state.showTooltips,
          showHints: state.showHints,
          autoSave: state.autoSave,
        }),
      },
    ),
    {
      name: "theme-store",
      // Only enable devtools in development
      enabled:
        import.meta.env.MODE === "development" ||
        import.meta.env.MODE === "nightly",
    },
  ),
);

// Initialize system preferences and listen for changes
if (typeof window !== "undefined") {
  // Initial detection
  useThemeStore.getState().updateSystemPreferences();

  // Listen for system preference changes
  const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const reducedMotionQuery = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );

  darkModeQuery.addEventListener("change", () => {
    useThemeStore.getState().updateSystemPreferences();
  });

  reducedMotionQuery.addEventListener("change", () => {
    useThemeStore.getState().updateSystemPreferences();
  });
}
