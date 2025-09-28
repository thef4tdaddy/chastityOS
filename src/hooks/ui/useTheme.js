import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import * as Sentry from '@sentry/react';

/**
 * Enhanced theme management hook with dynamic themes, user customization, and accessibility features
 * @param {string} userId - The user ID for personalized theme settings
 * @param {boolean} isAuthReady - Whether authentication is ready
 * @returns {object} Theme state and management functions
 */
export const useTheme = (userId, isAuthReady) => {
  // Theme state
  const [currentTheme, setCurrentTheme] = useState({
    id: 'default',
    name: 'Default',
    category: 'dark',
    colors: {},
    typography: {},
    spacing: {},
    animations: {},
    accessibility: {}
  });
  
  const [availableThemes] = useState([
    {
      id: 'default',
      name: 'Default Dark',
      category: 'dark',
      colors: {
        primary: '#7c3aed',
        secondary: '#1f2937',
        background: '#111827',
        text: '#ffffff'
      }
    },
    {
      id: 'light',
      name: 'Light Theme',
      category: 'light',
      colors: {
        primary: '#7c3aed',
        secondary: '#f3f4f6',
        background: '#ffffff',
        text: '#111827'
      }
    },
    {
      id: 'nightly',
      name: 'Nightly',
      category: 'dark',
      colors: {
        primary: '#8b5cf6',
        secondary: '#374151',
        background: '#0f172a',
        text: '#f1f5f9'
      }
    }
  ]);
  
  const [customThemes, setCustomThemes] = useState([]);
  
  const [preferences, setPreferences] = useState({
    autoTheme: false,
    systemThemeSync: true,
    animationsEnabled: true,
    customColorsEnabled: false
  });
  
  const [accessibilitySettings, setAccessibilitySettings] = useState({
    highContrast: false,
    reducedMotion: false,
    fontScale: 'normal', // 'small', 'normal', 'large', 'xl'
    colorBlindnessSupport: 'none' // 'none', 'protanopia', 'deuteranopia', 'tritanopia'
  });
  
  const [isLoading, setIsLoading] = useState(true);

  // Detect system theme preference
  const getSystemTheme = useCallback(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  }, []);

  // Load theme settings from Firebase
  useEffect(() => {
    if (!isAuthReady || !userId) {
      setIsLoading(false);
      return;
    }

    const loadThemeSettings = async () => {
      try {
        setIsLoading(true);
        const userDocRef = doc(db, 'users', userId);
        const docSnap = await getDoc(userDocRef);
        
        if (docSnap.exists() && docSnap.data().themeSettings) {
          const themeData = docSnap.data().themeSettings;
          
          if (themeData.currentTheme) {
            setCurrentTheme(prev => ({ ...prev, ...themeData.currentTheme }));
          }
          if (themeData.customThemes) {
            setCustomThemes(themeData.customThemes);
          }
          if (themeData.preferences) {
            setPreferences(prev => ({ ...prev, ...themeData.preferences }));
          }
          if (themeData.accessibilitySettings) {
            setAccessibilitySettings(prev => ({ ...prev, ...themeData.accessibilitySettings }));
          }
        }
      } catch (error) {
        console.error('Error loading theme settings:', error);
        Sentry.captureException(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadThemeSettings();
  }, [isAuthReady, userId]);

  // Save theme settings to Firebase
  const saveThemeSettings = useCallback(async (settings) => {
    if (!isAuthReady || !userId) return;
    
    try {
      const userDocRef = doc(db, 'users', userId);
      await setDoc(userDocRef, { themeSettings: settings }, { merge: true });
    } catch (error) {
      console.error('Error saving theme settings:', error);
      Sentry.captureException(error);
    }
  }, [isAuthReady, userId]);

  // Set theme by ID
  const setTheme = useCallback(async (themeId) => {
    const theme = availableThemes.find(t => t.id === themeId) || 
                  customThemes.find(t => t.id === themeId);
    
    if (theme) {
      setCurrentTheme(theme);
      await saveThemeSettings({
        currentTheme: theme,
        customThemes,
        preferences,
        accessibilitySettings
      });
    }
  }, [availableThemes, customThemes, preferences, accessibilitySettings, saveThemeSettings]);

  // Create custom theme
  const createCustomTheme = useCallback(async (themeDefinition) => {
    const customTheme = {
      id: `custom-${Date.now()}`,
      name: themeDefinition.name || 'Custom Theme',
      category: themeDefinition.category || 'dark',
      colors: { ...currentTheme.colors, ...themeDefinition.colors },
      typography: { ...currentTheme.typography, ...themeDefinition.typography },
      spacing: { ...currentTheme.spacing, ...themeDefinition.spacing },
      animations: { ...currentTheme.animations, ...themeDefinition.animations },
      accessibility: { ...currentTheme.accessibility, ...themeDefinition.accessibility },
      isCustom: true,
      createdAt: new Date().toISOString()
    };

    const newCustomThemes = [...customThemes, customTheme];
    setCustomThemes(newCustomThemes);
    
    await saveThemeSettings({
      currentTheme,
      customThemes: newCustomThemes,
      preferences,
      accessibilitySettings
    });

    return customTheme;
  }, [currentTheme, customThemes, preferences, accessibilitySettings, saveThemeSettings]);

  // Update theme preferences
  const updateThemePreferences = useCallback(async (newPreferences) => {
    const updatedPreferences = { ...preferences, ...newPreferences };
    setPreferences(updatedPreferences);
    
    await saveThemeSettings({
      currentTheme,
      customThemes,
      preferences: updatedPreferences,
      accessibilitySettings
    });
  }, [currentTheme, customThemes, preferences, accessibilitySettings, saveThemeSettings]);

  // Set dynamic colors
  const setDynamicColors = useCallback((colors) => {
    setCurrentTheme(prev => ({
      ...prev,
      colors: { ...prev.colors, ...colors }
    }));
  }, []);

  // Enable/disable auto theme
  const enableAutoTheme = useCallback(async (enabled) => {
    await updateThemePreferences({ autoTheme: enabled });
    
    if (enabled && preferences.systemThemeSync) {
      const systemTheme = getSystemTheme();
      const matchingTheme = availableThemes.find(t => t.category === systemTheme);
      if (matchingTheme) {
        await setTheme(matchingTheme.id);
      }
    }
  }, [updateThemePreferences, preferences.systemThemeSync, getSystemTheme, availableThemes, setTheme]);

  // Update accessibility settings
  const updateAccessibilitySettings = useCallback(async (newSettings) => {
    const updatedSettings = { ...accessibilitySettings, ...newSettings };
    setAccessibilitySettings(updatedSettings);
    
    await saveThemeSettings({
      currentTheme,
      customThemes,
      preferences,
      accessibilitySettings: updatedSettings
    });
  }, [currentTheme, customThemes, preferences, accessibilitySettings, saveThemeSettings]);

  // Enable/disable high contrast
  const enableHighContrast = useCallback(async (enabled) => {
    await updateAccessibilitySettings({ highContrast: enabled });
  }, [updateAccessibilitySettings]);

  // Set font size scale
  const setFontSize = useCallback(async (scale) => {
    await updateAccessibilitySettings({ fontScale: scale });
  }, [updateAccessibilitySettings]);

  // Listen for system theme changes
  useEffect(() => {
    if (preferences.autoTheme && preferences.systemThemeSync) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleSystemThemeChange = (e) => {
        const systemTheme = e.matches ? 'dark' : 'light';
        const matchingTheme = availableThemes.find(t => t.category === systemTheme);
        if (matchingTheme && matchingTheme.id !== currentTheme.id) {
          setTheme(matchingTheme.id);
        }
      };

      mediaQuery.addEventListener('change', handleSystemThemeChange);
      return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
    }
  }, [preferences.autoTheme, preferences.systemThemeSync, availableThemes, currentTheme.id, setTheme]);

  // Computed values
  const isDarkMode = currentTheme.category === 'dark';
  const hasCustomThemes = customThemes.length > 0;
  const isHighContrast = accessibilitySettings.highContrast;
  const currentFontScale = accessibilitySettings.fontScale;

  return {
    // Theme state
    currentTheme,
    availableThemes,
    customThemes,
    preferences,
    accessibilitySettings,
    isLoading,
    
    // Theme management
    setTheme,
    createCustomTheme,
    updateThemePreferences,
    
    // Dynamic theming
    setDynamicColors,
    enableAutoTheme,
    
    // Accessibility
    updateAccessibilitySettings,
    enableHighContrast,
    setFontSize,
    
    // Computed values
    isDarkMode,
    hasCustomThemes,
    isHighContrast,
    currentFontScale
  };
};