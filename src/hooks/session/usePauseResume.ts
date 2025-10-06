/**
 * Enhanced Pause/Resume System Hook (Refactored)
 * Provides advanced pause/resume functionality with keyholder overrides,
 * intelligent cooldown management, and comprehensive analytics
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { PauseCooldownService } from "../../services/PauseCooldownService";
import { useSharedTimer } from "../useSharedTimer";
import { serviceLogger } from "../../utils/logging";
import type {
  PauseStatus as _PauseStatus,
  CooldownState as _CooldownState,
  KeyholderOverrideCapabilities,
  PauseHistoryEntry as _PauseHistoryEntry,
  PauseAnalytics,
  PauseReason,
  PauseRequestStatus,
  OverrideRequestStatus,
  PausePattern,
  CooldownAnalytics,
} from "../../types/pauseResume";
import {
  calculatePauseFrequency,
  calculateCooldownDuration,
  calculatePauseAnalytics,
  analyzePausePatterns,
  calculateCooldownEffectiveness,
} from "../../utils/pauseAnalytics";
import {
  calculatePauseDuration,
  updatePauseHistoryOnResume,
  updatePauseStatusOnResume,
  createKeyholderOverrides,
} from "../../utils/pauseResumeHelpers";
import { usePauseState } from "./usePauseState";
import { useCooldownState } from "./useCooldownState";
import { usePauseDurationTracking } from "./usePauseDurationTracking";
import { usePauseKeyholderActions } from "./usePauseKeyholderActions";
import { usePauseRequests } from "./usePauseRequests";
import { usePauseInitialization } from "./usePauseInitialization";
import { usePauseSessionActions } from "./usePauseSessionActions";

const logger = serviceLogger("usePauseResume");

export const usePauseResume = (sessionId: string, relationshipId?: string) => {
  // Use shared timer for cooldown countdown
  const currentTime = useSharedTimer();

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

  // Use initialization hook
  const {
    keyholderOverrides,
    pauseAnalytics,
    isLoading,
    error,
  } = usePauseInitialization(
    sessionId,
    relationshipId,
    pauseHistory,
    startCooldown,
  );

  // Track pause duration
  usePauseDurationTracking(pauseStatus, updatePauseDuration);

  // Computed values
  const canPause = useMemo(() => {
    const result = !pauseStatus.isPaused && !cooldownState.isInCooldown;
    logger.debug("usePauseResume canPause calculation", {
      sessionId,
      isPaused: pauseStatus.isPaused,
      isInCooldown: cooldownState.isInCooldown,
      canPause: result,
    });
    return result;
  }, [sessionId, pauseStatus.isPaused, cooldownState.isInCooldown]);

  const canResume = useMemo(() => pauseStatus.isPaused, [pauseStatus.isPaused]);

  const timeUntilNextPause = useMemo(() => {
    if (!cooldownState.nextPauseAvailable) return 0;
    return Math.max(
      0,
      Math.floor(
        (cooldownState.nextPauseAvailable.getTime() - currentTime.getTime()) /
          1000,
      ),
    );
  }, [cooldownState.nextPauseAvailable, currentTime]);

  const hasKeyholderOverride = useMemo(
    () => keyholderOverrides.canOverrideCooldown,
    [keyholderOverrides.canOverrideCooldown],
  );

  const pauseFrequency = useMemo(
    () => calculatePauseFrequency(pauseHistory),
    [pauseHistory],
  );

  // Use session actions hook
  const { pauseSession, resumeSession } = usePauseSessionActions(
    sessionId,
    canPause,
    canResume,
    pauseStatus,
    cooldownState,
    pauseAnalytics,
    keyholderOverrides,
    startPause,
    setPauseStatus,
    setPauseHistory,
    startCooldown,
  );

  // Use sub-hooks for requests and keyholder actions
  const { requestEmergencyPause, requestCooldownOverride } = usePauseRequests(
    sessionId,
    relationshipId,
    cooldownState,
    pauseSession,
  );

  const {
    keyholderForcePause,
    keyholderForceResume,
    keyholderOverrideCooldown,
  } = usePauseKeyholderActions(
    sessionId,
    keyholderOverrides,
    startPause,
    resumeSession,
    clearCooldown,
  );

  // Analytics
  const getPausePatterns = useCallback((): PausePattern[] => {
    return analyzePausePatterns(pauseHistory);
  }, [pauseHistory]);

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
