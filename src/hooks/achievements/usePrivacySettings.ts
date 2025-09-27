import { useState } from "react";
import {
  useLeaderboards,
  LeaderboardPrivacySettings,
} from "../useLeaderboards";
import { serviceLogger } from "../../utils/logging";

const logger = serviceLogger("usePrivacySettings");

// Custom hook for privacy settings form management
export const usePrivacySettings = (userId?: string, onClose?: () => void) => {
  const { privacySettings, updateLeaderboardPrivacy, isUpdatingPrivacy } =
    useLeaderboards(userId);

  const [localSettings, setLocalSettings] =
    useState<LeaderboardPrivacySettings>(privacySettings);
  const [hasChanges, setHasChanges] = useState(false);

  // Handle individual setting changes
  const handleSettingChange = (
    key: keyof LeaderboardPrivacySettings,
    value: boolean | string,
  ) => {
    setLocalSettings((prev: LeaderboardPrivacySettings) => ({
      ...prev,
      [key]: value,
    }));
    setHasChanges(true);
  };

  // Handle form submission
  const handleSave = async () => {
    try {
      await updateLeaderboardPrivacy(localSettings);
      setHasChanges(false);
      if (onClose) onClose();
    } catch (error) {
      logger.error("Failed to save privacy settings", { error });
      throw error; // Re-throw to allow UI error handling
    }
  };

  // Reset form to initial state
  const handleReset = () => {
    setLocalSettings(privacySettings);
    setHasChanges(false);
  };

  // Check if form has unsaved changes
  const hasUnsavedChanges = hasChanges;

  return {
    // Settings state
    settings: localSettings,
    hasChanges: hasUnsavedChanges,
    isLoading: isUpdatingPrivacy,

    // Actions
    updateSetting: handleSettingChange,
    handleSave,
    handleReset,

    // Original settings for comparison
    originalSettings: privacySettings,
  };
};
