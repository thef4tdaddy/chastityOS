/**
 * useProfileSharing Hook
 * Handles share functionality and URL generation for profiles
 */

import { useCallback } from "react";
import { logger } from "@/utils/logging";

export const useProfileSharing = (username?: string) => {
  const generateProfileUrl = useCallback(() => {
    if (!username) return "";
    return `${window.location.origin}/profile/${username}`;
  }, [username]);

  const shareProfile = useCallback(async () => {
    const url = generateProfileUrl();
    const shareData = {
      title: `Check out ${username}'s profile`,
      text: `View ${username}'s achievements and progress on ChastityOS`,
      url,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(url);
        // Could trigger a toast notification here
        logger.info("Profile URL copied to clipboard");
      }
    } catch (error) {
      logger.error("Error sharing profile:", error);
    }
  }, [username, generateProfileUrl]);

  const copyProfileUrl = useCallback(async () => {
    const url = generateProfileUrl();
    try {
      await navigator.clipboard.writeText(url);
      // Could trigger a toast notification here
      logger.info("Profile URL copied to clipboard");
    } catch (error) {
      logger.error("Error copying profile URL:", error);
    }
  }, [generateProfileUrl]);

  return {
    shareProfile,
    copyProfileUrl,
    generateProfileUrl,
  };
};
