/**
 * Enhanced Pause/Resume System Hook (Refactored)
 * Provides advanced pause/resume functionality with keyholder overrides,
 * intelligent cooldown management, and comprehensive analytics
 */
import { useMemo } from "react";
import { calculatePauseFrequency } from "../../utils/pauseAnalytics";
import { usePauseState } from "./usePauseState";
import { useCooldownState } from "./useCooldownState";
import { usePauseDurationTracking } from "./usePauseDurationTracking";
import { usePauseInitialization } from "./usePauseInitialization";
import { usePauseRequests } from "./usePauseRequests";
import { usePauseKeyholderActions } from "./usePauseKeyholderActions";
import { usePauseAnalytics } from "./usePauseAnalytics";
import { usePauseResumeActions } from "./usePauseResumeActions";

export const usePauseResume = (sessionId: string, relationshipId?: string) => {
  // Use sub-hooks for state management
  const {
    pauseStatus,
    pauseHistory,
    setPauseStatus,
    setPauseHistory,
    startPause,
    updatePauseDuration,
  } = usePauseState(sessionId);

  const { cooldownState, startCooldown, clearCooldown } = useCooldownState();

  // Track pause duration
  usePauseDurationTracking(pauseStatus, updatePauseDuration);

  // Initialize pause system
  const { keyholderOverrides, pauseAnalytics, isLoading, error } =
    usePauseInitialization({
      sessionId,
      relationshipId,
      pauseHistory,
      startCooldown,
    });

  // Computed values
  const canPause = useMemo(
    () => !pauseStatus.isPaused && !cooldownState.isInCooldown,
    [pauseStatus.isPaused, cooldownState.isInCooldown],
  );

  const canResume = useMemo(() => pauseStatus.isPaused, [pauseStatus.isPaused]);

  const timeUntilNextPause = useMemo(() => {
    if (!cooldownState.nextPauseAvailable) return 0;
    return Math.max(
      0,
      Math.floor(
        (cooldownState.nextPauseAvailable.getTime() - Date.now()) / 1000,
      ),
    );
  }, [cooldownState.nextPauseAvailable]);

  const hasKeyholderOverride = useMemo(
    () => keyholderOverrides.canOverrideCooldown,
    [keyholderOverrides.canOverrideCooldown],
  );

  const pauseFrequency = useMemo(
    () => calculatePauseFrequency(pauseHistory),
    [pauseHistory],
  );

  // Basic pause/resume actions
  const { pauseSession, resumeSession } = usePauseResumeActions({
    sessionId,
    canPause,
    canResume,
    pauseStatus,
    pauseAnalytics,
    keyholderOverrides,
    startPause,
    setPauseStatus,
    setPauseHistory,
    startCooldown,
  });

  // Pause requests (emergency and cooldown override)
  const { requestEmergencyPause, requestCooldownOverride } = usePauseRequests({
    sessionId,
    relationshipId,
    cooldownState,
    pauseSession,
  });

  // Keyholder actions
  const {
    keyholderForcePause,
    keyholderForceResume,
    keyholderOverrideCooldown,
  } = usePauseKeyholderActions({
    sessionId,
    keyholderOverrides,
    startPause,
    resumeSession,
    clearCooldown,
  });

  // Analytics
  const { getPausePatterns, getCooldownEffectiveness } = usePauseAnalytics({
    pauseHistory,
    cooldownState,
  });

  return {
    // Enhanced state
    pauseStatus,
    cooldownState,
    keyholderOverrides,
    pauseAnalytics,

    // Basic actions
    pauseSession,
    resumeSession,

    // Enhanced actions
    requestEmergencyPause,
    requestCooldownOverride,

    // Keyholder actions
    keyholderForcePause,
    keyholderForceResume,
    keyholderOverrideCooldown,

    // Analytics
    getPausePatterns,
    getCooldownEffectiveness,

    // Computed values
    canPause,
    canResume,
    timeUntilNextPause,
    hasKeyholderOverride,
    pauseFrequency,

    // Loading states
    isLoading,
    error,
  };
};
