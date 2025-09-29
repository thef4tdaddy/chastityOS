/**
 * Theme system types for enhanced theme management
 */

// Theme Categories
export enum ThemeCategory {
  LIGHT = "light",
  DARK = "dark",
  HIGH_CONTRAST = "high-contrast",
  CUSTOM = "custom",
}

// Font Scale
export enum FontScale {
  SMALL = "small",
  MEDIUM = "medium",
  LARGE = "large",
  EXTRA_LARGE = "extra-large",
}

// Color Palette Interface
export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

// Typography Settings
export interface TypographySettings {
  fontFamily: string;
  baseSize: number;
  lineHeight: number;
  letterSpacing: number;
}

// Spacing Scale
export interface SpacingScale {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  xxl: string;
}

// Animation Settings
export interface AnimationSettings {
  duration: number;
  easing: string;
  enabled: boolean;
}

// Accessibility Features
export interface AccessibilityFeatures {
  highContrast: boolean;
  reducedMotion: boolean;
  focusVisible: boolean;
  screenReader: boolean;
}

// Theme Interface
export interface Theme {
  id: string;
  name: string;
  category: ThemeCategory;
  colors: ColorPalette;
  typography: TypographySettings;
  spacing: SpacingScale;
  animations: AnimationSettings;
  accessibility: AccessibilityFeatures;
}

// Custom Theme Definition
export interface CustomThemeDefinition {
  name: string;
  baseTheme: string;
  overrides: Partial<Omit<Theme, "id" | "name" | "category">>;
}

// Custom Theme
export interface CustomTheme extends Theme {
  baseTheme: string;
  isUserCreated: boolean;
  createdAt: Date;
}

// Theme Preferences
export interface ThemePreferences {
  autoSwitch: boolean;
  lightThemeId: string;
  darkThemeId: string;
  scheduleEnabled: boolean;
  lightModeStart: string; // HH:mm format
  darkModeStart: string; // HH:mm format
  systemSyncEnabled: boolean;
}

// Accessibility Settings
export interface AccessibilitySettings {
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: FontScale;
  focusOutlines: boolean;
  screenReaderMode: boolean;
  keyboardNavigation: boolean;
}

// Enhanced Theme State
export interface EnhancedThemeState {
  currentTheme: Theme;
  availableThemes: Theme[];
  customThemes: CustomTheme[];
  preferences: ThemePreferences;
  accessibilitySettings: AccessibilitySettings;
  isLoading: boolean;
  isDarkMode: boolean;
}
