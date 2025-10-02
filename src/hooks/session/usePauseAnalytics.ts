/**
 * Pause Analytics
 *
 * Provides analytics and pattern analysis for pause/resume behavior
 * including pause patterns and cooldown effectiveness.
 */
import { useCallback } from "react";
import {
  analyzePausePatterns,
  calculateCooldownEffectiveness,
} from "../../utils/pauseAnalytics";
import type {
  PauseHistoryEntry,
  CooldownState,
  PausePattern,
  CooldownAnalytics,
} from "../../types/pauseResume";

interface UsePauseAnalyticsProps {
  pauseHistory: PauseHistoryEntry[];
  cooldownState: CooldownState;
}

export const usePauseAnalytics = ({
  pauseHistory,
  cooldownState,
}: UsePauseAnalyticsProps) => {
  // Get pause patterns
  const getPausePatterns = useCallback((): PausePattern[] => {
    return analyzePausePatterns(pauseHistory);
  }, [pauseHistory]);

  // Get cooldown effectiveness
  const getCooldownEffectiveness = useCallback((): CooldownAnalytics => {
    return {
      effectiveness: calculateCooldownEffectiveness(
        pauseHistory,
        cooldownState,
      ),
      averageCooldownDuration: cooldownState.adaptiveDuration,
      overrideFrequency: 0,
      adaptiveAdjustments: 0,
    };
  }, [pauseHistory, cooldownState]);

  return {
    getPausePatterns,
    getCooldownEffectiveness,
  };
};
