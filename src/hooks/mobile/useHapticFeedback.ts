/**
 * Haptic Feedback Hook
 * Provides vibration patterns for mobile devices
 */
import { useCallback } from "react";
import { logger } from "../../utils/logging";

interface HapticFeedbackReturn {
  light: () => void;
  medium: () => void;
  heavy: () => void;
  success: () => void;
  error: () => void;
  notification: () => void;
  custom: (pattern: number | number[]) => void;
  isSupported: boolean;
}

export const useHapticFeedback = (): HapticFeedbackReturn => {
  const isSupported = "vibrate" in navigator;

  const vibrate = useCallback(
    (pattern: number | number[]) => {
      if (!isSupported) return;

      try {
        navigator.vibrate(pattern);
      } catch (error) {
        logger.warn("Haptic feedback failed", { error }, "useHapticFeedback");
      }
    },
    [isSupported],
  );

  const light = useCallback(() => {
    vibrate(50);
  }, [vibrate]);

  const medium = useCallback(() => {
    vibrate(100);
  }, [vibrate]);

  const heavy = useCallback(() => {
    vibrate(200);
  }, [vibrate]);

  const success = useCallback(() => {
    // Two quick pulses
    vibrate([50, 50, 50]);
  }, [vibrate]);

  const error = useCallback(() => {
    // Strong double pulse
    vibrate([100, 50, 100, 50, 100]);
  }, [vibrate]);

  const notification = useCallback(() => {
    // Single pulse
    vibrate(75);
  }, [vibrate]);

  const custom = useCallback(
    (pattern: number | number[]) => {
      vibrate(pattern);
    },
    [vibrate],
  );

  return {
    light,
    medium,
    heavy,
    success,
    error,
    notification,
    custom,
    isSupported,
  };
};
