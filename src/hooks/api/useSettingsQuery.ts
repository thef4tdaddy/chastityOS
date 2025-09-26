/**
 * Settings TanStack Query Hooks
 * Manages user settings with Dexie as backend
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsDBService } from "@/services/database";
import { cacheConfig } from "@/services/cache-config";
import { firebaseSync } from "@/services/sync";
import type { DBSettings } from "@/types/database";

/**
 * Query for getting user settings
 */
export function useSettingsQuery(userId: string | undefined) {
  return useQuery({
    queryKey: ["settings", "user", userId],
    queryFn: async () => {
      if (!userId) return null;

      // Always read from local Dexie first for instant response
      let settings = await settingsDBService.getUserSettings(userId);

      // If no settings exist, create default settings
      if (!settings) {
        settings = await settingsDBService.createDefaultSettings(userId);
      }

      // Trigger background sync if online to ensure data freshness
      if (navigator.onLine) {
        firebaseSync.syncUserSettings(userId).catch((error) => {
          console.warn("Background settings sync failed:", error);
        });
      }

      return settings;
    },
    ...cacheConfig.userSettings, // Apply specific cache settings
    enabled: !!userId, // Only run when userId is available
  });
}

/**
 * Mutations for settings operations
 */
export function useSettingsMutations() {
  const queryClient = useQueryClient();

  const updateSettings = useMutation({
    mutationFn: async (params: {
      userId: string;
      settings: Partial<DBSettings>;
    }) => {
      // 1. Update local Dexie immediately for optimistic update
      const updatedSettings = await settingsDBService.updateSettings(
        params.userId,
        params.settings,
      );

      // 2. Trigger Firebase sync in background
      if (navigator.onLine) {
        firebaseSync.syncUserSettings(params.userId).catch((error) => {
          console.warn("Settings update sync failed:", error);
        });
      }

      return updatedSettings;
    },
    onSuccess: (data, variables) => {
      // Update the settings cache immediately
      queryClient.setQueryData(["settings", "user", variables.userId], data);
    },
    onError: (error) => {
      console.error("Failed to update settings:", error);

      // Invalidate cache to refetch from server in case of error
      queryClient.invalidateQueries({
        queryKey: ["settings", "user"],
      });
    },
  });

  const resetSettings = useMutation({
    mutationFn: async (params: { userId: string }) => {
      // 1. Reset to defaults in local Dexie
      const defaultSettings = await settingsDBService.createDefaultSettings(
        params.userId,
      );

      // 2. Trigger Firebase sync in background
      if (navigator.onLine) {
        firebaseSync.syncUserSettings(params.userId).catch((error) => {
          console.warn("Settings reset sync failed:", error);
        });
      }

      return defaultSettings;
    },
    onSuccess: (data, variables) => {
      // Update the settings cache with default values
      queryClient.setQueryData(["settings", "user", variables.userId], data);
    },
    onError: (error) => {
      console.error("Failed to reset settings:", error);
    },
  });

  const updateTheme = useMutation({
    mutationFn: async (params: { userId: string; theme: "light" | "dark" }) => {
      // Quick theme update
      const updatedSettings = await settingsDBService.updateSettings(
        params.userId,
        { theme: params.theme },
      );

      // Background sync
      if (navigator.onLine) {
        firebaseSync.syncUserSettings(params.userId).catch((error) => {
          console.warn("Theme update sync failed:", error);
        });
      }

      return updatedSettings;
    },
    onSuccess: (data, variables) => {
      // Update settings cache
      queryClient.setQueryData(["settings", "user", variables.userId], data);
    },
  });

  const updateEventDisplayMode = useMutation({
    mutationFn: async (params: {
      userId: string;
      eventDisplayMode: "kinky" | "vanilla";
    }) => {
      const updatedSettings = await settingsDBService.updateSettings(
        params.userId,
        { eventDisplayMode: params.eventDisplayMode },
      );

      // Background sync
      if (navigator.onLine) {
        firebaseSync.syncUserSettings(params.userId).catch((error) => {
          console.warn("Event display mode sync failed:", error);
        });
      }

      return updatedSettings;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(["settings", "user", variables.userId], data);
    },
  });

  return {
    updateSettings,
    resetSettings,
    updateTheme,
    updateEventDisplayMode,
  };
}
