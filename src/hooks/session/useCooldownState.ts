/**
 * Cooldown State Management Hook
 * Manages cooldown state and cooldown timer
 */
import { useState, useEffect, useCallback } from "react";
import type { CooldownState } from "../../types/pauseResume";
import {
  createCooldownState,
  updateCooldownProgress,
  clearCooldownState,
} from "../../utils/pauseResumeHelpers";

const createInitialCooldownState = (): CooldownState => ({
  isInCooldown: false,
  cooldownRemaining: 0,
  nextPauseAvailable: null,
  cooldownReason: "frequent_pausing",
  canOverride: false,
  adaptiveDuration: 300, // 5 minutes default
});

export function useCooldownState() {
  const [cooldownState, setCooldownState] = useState(
    createInitialCooldownState,
  );

  // Cooldown countdown timer
  useEffect(() => {
    if (!cooldownState.isInCooldown || cooldownState.cooldownRemaining <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setCooldownState((prev) => updateCooldownProgress(prev));
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownState.isInCooldown, cooldownState.cooldownRemaining]);

  const startCooldown = useCallback(
    (cooldownDuration: number, canOverride: boolean) => {
      if (cooldownDuration > 0) {
        setCooldownState(createCooldownState(cooldownDuration, canOverride));
      }
    },
    [],
  );

  const clearCooldown = useCallback(() => {
    setCooldownState((prev) => clearCooldownState(prev));
  }, []);

  return {
    cooldownState,
    setCooldownState,
    startCooldown,
    clearCooldown,
  };
}
