/**
 * Enhanced Pause/Resume System Hook (Refactored)
 * Provides advanced pause/resume functionality with keyholder overrides,
 * intelligent cooldown management, and comprehensive analytics
 */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { PauseCooldownService } from "../../services/PauseCooldownService";
import { serviceLogger } from "../../utils/logging";
import type {
  PauseStatus,
  CooldownState,
  KeyholderOverrideCapabilities,
  PauseHistoryEntry,
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

const logger = serviceLogger("usePauseResume");

const createInitialKeyholderOverrides = (): KeyholderOverrideCapabilities => ({
  canOverrideCooldown: false,
  canForcePause: false,
  canForceResume: false,
  canModifyCooldownDuration: false,
  requiresReason: true,
});

const createInitialPauseAnalytics = (): PauseAnalytics => ({
  totalPauses: 0,
  averagePauseDuration: 0,
  pauseFrequency: 0,
  emergencyPauseCount: 0,
  keyholderInitiatedCount: 0,
  cooldownViolations: 0,
  patterns: [],
});

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

  const [keyholderOverrides, setKeyholderOverrides] = useState(
    createInitialKeyholderOverrides
  );
  const [pauseAnalytics, setPauseAnalytics] = useState(createInitialPauseAnalytics);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track pause duration
  usePauseDurationTracking(pauseStatus, updatePauseDuration);

  // Computed values
  const canPause = useMemo(
    () => !pauseStatus.isPaused && !cooldownState.isInCooldown,
    [pauseStatus.isPaused, cooldownState.isInCooldown]
  );

  const canResume = useMemo(() => pauseStatus.isPaused, [pauseStatus.isPaused]);

  const timeUntilNextPause = useMemo(() => {
    if (!cooldownState.nextPauseAvailable) return 0;
    return Math.max(
      0,
      Math.floor((cooldownState.nextPauseAvailable.getTime() - Date.now()) / 1000)
    );
  }, [cooldownState.nextPauseAvailable]);

  const hasKeyholderOverride = useMemo(
    () => keyholderOverrides.canOverrideCooldown,
    [keyholderOverrides.canOverrideCooldown]
  );

  const pauseFrequency = useMemo(
    () => calculatePauseFrequency(pauseHistory),
    [pauseHistory]
  );

  // Initialize keyholder overrides
  const initializeKeyholderOverrides = useCallback(() => {
    if (relationshipId) {
      setKeyholderOverrides(createKeyholderOverrides());
    }
  }, [relationshipId]);

  // Load data functions
  const loadPauseState = useCallback(async () => {
    // Integration with pause state service
  }, [sessionId]);

  const loadCooldownState = useCallback(async () => {
    try {
      const cooldownInfo = await PauseCooldownService.canUserPause(sessionId);
      if (cooldownInfo && !cooldownInfo.canPause) {
        startCooldown(
          cooldownInfo.cooldownRemaining || 0,
          keyholderOverrides.canOverrideCooldown
        );
      }
    } catch (err) {
      logger.error("Failed to load cooldown state", { error: err });
    }
  }, [sessionId, keyholderOverrides.canOverrideCooldown, startCooldown]);

  const loadPauseHistory = useCallback(async () => {
    // Load pause history from service
  }, [sessionId]);

  const loadPauseAnalytics = useCallback(async () => {
    try {
      const analytics = calculatePauseAnalytics(pauseHistory);
      setPauseAnalytics(analytics);
    } catch (err) {
      logger.error("Failed to load pause analytics", { error: err });
    }
  }, [pauseHistory]);

  // Initialization
  useEffect(() => {
    const initializePauseSystem = async () => {
      if (!sessionId) return;

      try {
        setIsLoading(true);
        setError(null);

        initializeKeyholderOverrides();
        await Promise.all([
          loadPauseState(),
          loadCooldownState(),
          loadPauseHistory(),
          loadPauseAnalytics(),
        ]);
      } catch (err) {
        logger.error("Failed to initialize pause system", { error: err });
        setError(
          err instanceof Error ? err.message : "Failed to initialize pause system"
        );
      } finally {
        setIsLoading(false);
      }
    };

    initializePauseSystem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, relationshipId]);

  // Pause session
  const pauseSession = useCallback(
    async (reason: PauseReason): Promise<void> => {
      if (!canPause) {
        throw new Error("Cannot pause: either already paused or in cooldown");
      }

      try {
        logger.debug("Pausing session", { sessionId, reason });
        startPause(reason);
        logger.info("Session paused successfully", { sessionId, reason });
      } catch (err) {
        logger.error("Failed to pause session", { error: err });
        throw err;
      }
    },
    [canPause, sessionId, startPause]
  );

  // Resume session
  const resumeSession = useCallback(async (): Promise<void> => {
    if (!canResume) {
      throw new Error("Cannot resume: session is not paused");
    }

    try {
      logger.debug("Resuming session", { sessionId });

      const resumeTime = new Date();
      const duration = calculatePauseDuration(pauseStatus.pauseStartTime, resumeTime);

      setPauseStatus(updatePauseStatusOnResume(pauseStatus));
      setPauseHistory((prev) =>
        updatePauseHistoryOnResume(prev, resumeTime, duration)
      );

      const cooldownDur = calculateCooldownDuration(pauseAnalytics, duration);
      startCooldown(cooldownDur, keyholderOverrides.canOverrideCooldown);

      logger.info("Session resumed successfully", { sessionId, pauseDuration: duration });
    } catch (err) {
      logger.error("Failed to resume session", { error: err });
      throw err;
    }
  }, [
    canResume,
    sessionId,
    pauseStatus,
    pauseAnalytics,
    keyholderOverrides.canOverrideCooldown,
    setPauseStatus,
    setPauseHistory,
    startCooldown,
  ]);

  // Emergency pause
  const requestEmergencyPause = useCallback(
    async (reason: string): Promise<PauseRequestStatus> => {
      try {
        logger.debug("Requesting emergency pause", { sessionId, reason });

        if (cooldownState.isInCooldown) {
          logger.warn("Emergency pause bypassing cooldown", { sessionId });
        }

        await pauseSession("emergency");

        return {
          approved: true,
          reason: "Emergency pause approved automatically",
          requestId: `emergency_${Date.now()}`,
          approvedBy: "emergency_protocol",
          approvedAt: new Date(),
        };
      } catch (err) {
        logger.error("Failed to request emergency pause", { error: err });
        return {
          approved: false,
          reason: err instanceof Error ? err.message : "Unknown error",
          requestId: `emergency_${Date.now()}`,
        };
      }
    },
    [sessionId, cooldownState.isInCooldown, pauseSession]
  );

  // Request cooldown override
  const requestCooldownOverride = useCallback(
    async (justification: string): Promise<OverrideRequestStatus> => {
      if (!relationshipId) {
        return {
          approved: false,
          reason: "Cooldown override requires keyholder relationship",
          requestId: `override_${Date.now()}`,
          overrideType: "cooldown",
        };
      }

      try {
        logger.debug("Requesting cooldown override", { sessionId, justification });

        return {
          approved: false,
          reason: "Override request sent to keyholder",
          requestId: `override_${Date.now()}`,
          overrideType: "cooldown",
        };
      } catch (err) {
        logger.error("Failed to request cooldown override", { error: err });
        return {
          approved: false,
          reason: err instanceof Error ? err.message : "Unknown error",
          requestId: `override_${Date.now()}`,
          overrideType: "cooldown",
        };
      }
    },
    [sessionId, relationshipId]
  );

  // Keyholder force pause
  const keyholderForcePause = useCallback(
    async (reason: string): Promise<void> => {
      if (!keyholderOverrides.canForcePause) {
        throw new Error("Keyholder does not have force pause permissions");
      }

      try {
        logger.debug("Keyholder forcing pause", { sessionId, reason });
        startPause("keyholder_request", "keyholder");
        logger.info("Keyholder force pause successful", { sessionId });
      } catch (err) {
        logger.error("Failed to execute keyholder force pause", { error: err });
        throw err;
      }
    },
    [keyholderOverrides.canForcePause, sessionId, startPause]
  );

  // Keyholder force resume
  const keyholderForceResume = useCallback(
    async (reason: string): Promise<void> => {
      if (!keyholderOverrides.canForceResume) {
        throw new Error("Keyholder does not have force resume permissions");
      }

      try {
        logger.debug("Keyholder forcing resume", { sessionId, reason });
        await resumeSession();
        logger.info("Keyholder force resume successful", { sessionId });
      } catch (err) {
        logger.error("Failed to execute keyholder force resume", { error: err });
        throw err;
      }
    },
    [keyholderOverrides.canForceResume, sessionId, resumeSession]
  );

  // Keyholder override cooldown
  const keyholderOverrideCooldown = useCallback(
    async (reason: string): Promise<void> => {
      if (!keyholderOverrides.canOverrideCooldown) {
        throw new Error("Keyholder does not have cooldown override permissions");
      }

      try {
        logger.debug("Keyholder overriding cooldown", { sessionId, reason });
        clearCooldown();
        logger.info("Keyholder cooldown override successful", { sessionId });
      } catch (err) {
        logger.error("Failed to execute keyholder cooldown override", { error: err });
        throw err;
      }
    },
    [keyholderOverrides.canOverrideCooldown, sessionId, clearCooldown]
  );

  // Analytics
  const getPausePatterns = useCallback((): PausePattern[] => {
    return analyzePausePatterns(pauseHistory);
  }, [pauseHistory]);

  const getCooldownEffectiveness = useCallback((): CooldownAnalytics => {
    return {
      effectiveness: calculateCooldownEffectiveness(pauseHistory, cooldownState),
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

export default usePauseResume;
