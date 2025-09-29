/**
 * Enhanced Pause/Resume System Hook
 * Provides advanced pause/resume functionality with keyholder overrides,
 * intelligent cooldown management, and comprehensive analytics
 */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { PauseCooldownService } from "../../services/PauseCooldownService";
import { serviceLogger } from "../../utils/logging";
import {
  calculatePauseFrequency,
  calculateCooldownDuration,
  calculatePauseAnalytics,
  analyzePausePatterns,
  calculateCooldownEffectiveness,
} from "../../utils/pauseAnalytics";

const logger = serviceLogger("usePauseResume");

// ==================== INTERFACES ====================

export interface PauseStatus {
  isPaused: boolean;
  pauseStartTime?: Date;
  pauseDuration: number; // Current pause duration in seconds
  pauseReason?: string;
  canResume: boolean;
  pauseCount: number; // Number of pauses in current session
}

export interface CooldownState {
  isInCooldown: boolean;
  cooldownRemaining: number; // Seconds remaining
  nextPauseAvailable: Date | null;
  cooldownReason: CooldownReason;
  canOverride: boolean;
  adaptiveDuration: number; // Adaptive cooldown based on usage patterns
}

export interface KeyholderOverrideCapabilities {
  canOverrideCooldown: boolean;
  canForcePause: boolean;
  canForceResume: boolean;
  canModifyCooldownDuration: boolean;
  requiresReason: boolean;
}

export interface PauseHistoryEntry {
  id: string;
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  reason: string;
  initiatedBy: "submissive" | "keyholder" | "system";
  wasEmergency: boolean;
}

export interface PauseAnalytics {
  totalPauses: number;
  averagePauseDuration: number;
  pauseFrequency: number; // Pauses per session
  emergencyPauseCount: number;
  keyholderInitiatedCount: number;
  cooldownViolations: number;
  patterns: PausePattern[];
}

export interface PausePattern {
  type: "time_based" | "duration_based" | "frequency_based";
  description: string;
  frequency: number;
  severity: "low" | "medium" | "high";
}

export interface CooldownAnalytics {
  effectiveness: number; // 0-100% how well cooldowns prevent excessive pausing
  averageCooldownDuration: number;
  overrideFrequency: number;
  adaptiveAdjustments: number;
}

export interface EnhancedPauseState {
  pauseStatus: PauseStatus;
  cooldownState: CooldownState;
  keyholderOverrides: KeyholderOverrideCapabilities;
  pauseHistory: PauseHistoryEntry[];
  pauseAnalytics: PauseAnalytics;
}

export type PauseReason =
  | "bathroom"
  | "meal"
  | "emergency"
  | "hygiene"
  | "medical"
  | "technical"
  | "keyholder_request"
  | "other";

export type CooldownReason =
  | "frequent_pausing"
  | "short_intervals"
  | "session_abuse"
  | "keyholder_restriction"
  | "adaptive_learning";

export interface PauseRequestStatus {
  approved: boolean;
  reason?: string;
  requestId: string;
  approvedBy?: "keyholder" | "system" | "emergency_protocol";
  approvedAt?: Date;
}

export interface OverrideRequestStatus {
  approved: boolean;
  reason?: string;
  requestId: string;
  overrideType: "cooldown" | "force_pause" | "force_resume";
  approvedAt?: Date;
}

// ==================== HELPER FUNCTIONS ====================

const createInitialPauseStatus = (): PauseStatus => ({
  isPaused: false,
  pauseDuration: 0,
  canResume: false,
  pauseCount: 0,
});

const createInitialCooldownState = (): CooldownState => ({
  isInCooldown: false,
  cooldownRemaining: 0,
  nextPauseAvailable: null,
  cooldownReason: "frequent_pausing",
  canOverride: false,
  adaptiveDuration: 300, // 5 minutes default
});

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

// ==================== HOOK IMPLEMENTATION ====================

export const usePauseResume = (sessionId: string, relationshipId?: string) => {
  // ==================== STATE ====================

  const [pauseStatus, setPauseStatus] = useState(createInitialPauseStatus);
  const [cooldownState, setCooldownState] = useState(createInitialCooldownState);
  const [keyholderOverrides, setKeyholderOverrides] = useState(createInitialKeyholderOverrides);
  const [pauseHistory, setPauseHistory] = useState<PauseHistoryEntry[]>([]);
  const [pauseAnalytics, setPauseAnalytics] = useState(createInitialPauseAnalytics);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ==================== COMPUTED VALUES ====================

  const canPause = useMemo(
    () => !pauseStatus.isPaused && !cooldownState.isInCooldown,
    [pauseStatus.isPaused, cooldownState.isInCooldown],
  );

  const canResume = useMemo(() => pauseStatus.isPaused, [pauseStatus.isPaused]);

  const timeUntilNextPause = useMemo(
    () =>
      cooldownState.nextPauseAvailable
        ? Math.max(
            0,
            Math.floor(
              (cooldownState.nextPauseAvailable.getTime() - Date.now()) / 1000,
            ),
          )
        : 0,
    [cooldownState.nextPauseAvailable],
  );

  const hasKeyholderOverride = useMemo(
    () => keyholderOverrides.canOverrideCooldown,
    [keyholderOverrides.canOverrideCooldown],
  );

  const pauseFrequency = useMemo(
    () => calculatePauseFrequency(pauseHistory),
    [pauseHistory],
  );

  // ==================== INITIALIZATION ====================

  const initializeKeyholderOverrides = useCallback((relationshipId?: string) => {
    if (relationshipId) {
      setKeyholderOverrides({
        canOverrideCooldown: true,
        canForcePause: true,
        canForceResume: true,
        canModifyCooldownDuration: true,
        requiresReason: true,
      });
    }
  }, []);

  const loadInitialData = useCallback(async () => {
    await Promise.all([
      loadPauseState(),
      loadCooldownState(),
      loadPauseHistory(),
      loadPauseAnalytics(),
    ]);
  }, []);

  useEffect(() => {
    const initializePauseSystem = async () => {
      if (!sessionId) return;

      try {
        setIsLoading(true);
        setError(null);

        initializeKeyholderOverrides(relationshipId);
        await loadInitialData();
      } catch (err) {
        logger.error("Failed to initialize pause system", { error: err });
        setError(
          err instanceof Error
            ? err.message
            : "Failed to initialize pause system",
        );
      } finally {
        setIsLoading(false);
      }
    };

    initializePauseSystem();
  }, [sessionId, relationshipId, initializeKeyholderOverrides, loadInitialData]);

  // ==================== COOLDOWN COUNTDOWN ====================

  useEffect(() => {
    if (!cooldownState.isInCooldown || cooldownState.cooldownRemaining <= 0)
      return;

    const interval = setInterval(() => {
      setCooldownState((prev) => {
        const newRemaining = Math.max(0, prev.cooldownRemaining - 1);

        if (newRemaining === 0) {
          return {
            ...prev,
            isInCooldown: false,
            cooldownRemaining: 0,
            nextPauseAvailable: null,
          };
        }

        return {
          ...prev,
          cooldownRemaining: newRemaining,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownState.isInCooldown, cooldownState.cooldownRemaining]);

  // ==================== PAUSE DURATION TRACKING ====================

  useEffect(() => {
    if (!pauseStatus.isPaused || !pauseStatus.pauseStartTime) return;

    const interval = setInterval(() => {
      setPauseStatus((prev) => ({
        ...prev,
        pauseDuration: Math.floor(
          (Date.now() - prev.pauseStartTime!.getTime()) / 1000,
        ),
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [pauseStatus.isPaused, pauseStatus.pauseStartTime]);

  // ==================== DATA LOADING FUNCTIONS ====================

  const loadPauseState = useCallback(async () => {
    try {
      // This would integrate with your existing pause state service
      // Check if session is currently paused
      setPauseStatus({
        isPaused: false,
        pauseDuration: 0,
        canResume: false,
        pauseCount: 0,
      });
    } catch (error) {
      logger.error("Failed to load pause state", { error });
    }
  }, [sessionId]);

  const loadCooldownState = useCallback(async () => {
    try {
      // This would integrate with PauseCooldownService
      const cooldownInfo = await PauseCooldownService.canUserPause(sessionId);

      if (cooldownInfo && !cooldownInfo.canPause) {
        setCooldownState({
          isInCooldown: true,
          cooldownRemaining: cooldownInfo.cooldownRemaining || 0,
          nextPauseAvailable: cooldownInfo.nextPauseAvailable || null,
          cooldownReason: "frequent_pausing",
          canOverride: keyholderOverrides.canOverrideCooldown,
          adaptiveDuration: cooldownInfo.cooldownRemaining || 300,
        });
      }
    } catch (error) {
      logger.error("Failed to load cooldown state", { error });
    }
  }, [sessionId, keyholderOverrides.canOverrideCooldown]);

  const loadPauseHistory = useCallback(async () => {
    try {
      // This would integrate with your pause history service
      setPauseHistory([]);
    } catch (error) {
      logger.error("Failed to load pause history", { error });
    }
  }, [sessionId]);

  const loadPauseAnalytics = useCallback(async () => {
    try {
      // This would calculate analytics from pause history
      const analytics = calculatePauseAnalytics(pauseHistory);
      setPauseAnalytics(analytics);
    } catch (error) {
      logger.error("Failed to load pause analytics", { error });
    }
  }, [pauseHistory]);

  // ==================== BASIC PAUSE/RESUME ACTIONS ====================

  const createPauseHistoryEntry = useCallback((
    sessionId: string,
    pauseTime: Date,
    reason: PauseReason,
    initiatedBy: "submissive" | "keyholder" | "system" = "submissive"
  ): PauseHistoryEntry => {
    return {
      id: `pause_${Date.now()}`,
      sessionId,
      startTime: pauseTime,
      duration: 0,
      reason,
      initiatedBy,
      wasEmergency: reason === "emergency",
    };
  }, []);

  const updatePauseStatusOnStart = useCallback((
    pauseTime: Date,
    reason: PauseReason,
    setPauseStatus: React.Dispatch<React.SetStateAction<PauseStatus>>
  ) => {
    setPauseStatus((prev) => ({
      ...prev,
      isPaused: true,
      pauseStartTime: pauseTime,
      pauseReason: reason,
      canResume: true,
      pauseCount: prev.pauseCount + 1,
    }));
  }, []);

  const pauseSession = useCallback(
    async (reason: PauseReason): Promise<void> => {
      if (!canPause) {
        throw new Error("Cannot pause: either already paused or in cooldown");
      }

      try {
        logger.debug("Pausing session", { sessionId, reason });

        const pauseTime = new Date();
        updatePauseStatusOnStart(pauseTime, reason, setPauseStatus);

        const newHistoryEntry = createPauseHistoryEntry(sessionId, pauseTime, reason);
        setPauseHistory((prev) => [...prev, newHistoryEntry]);

        logger.info("Session paused successfully", { sessionId, reason });
      } catch (error) {
        logger.error("Failed to pause session", { error });
        throw error;
      }
    },
    [canPause, sessionId, createPauseHistoryEntry, updatePauseStatusOnStart],
  );

  const calculatePauseDuration = useCallback((
    pauseStartTime: Date | undefined,
    resumeTime: Date
  ): number => {
    return pauseStartTime
      ? Math.floor((resumeTime.getTime() - pauseStartTime.getTime()) / 1000)
      : 0;
  }, []);

  const updatePauseHistoryOnResume = useCallback((
    resumeTime: Date,
    pauseDuration: number,
    setPauseHistory: React.Dispatch<React.SetStateAction<PauseHistoryEntry[]>>
  ) => {
    setPauseHistory((prev) => {
      const lastPause = prev[prev.length - 1];
      if (lastPause && !lastPause.endTime) {
        return prev.map((entry, index) =>
          index === prev.length - 1
            ? { ...entry, endTime: resumeTime, duration: pauseDuration }
            : entry,
        );
      }
      return prev;
    });
  }, []);

  const startCooldownIfNeeded = useCallback((cooldownDuration: number) => {
    if (cooldownDuration > 0) {
      setCooldownState({
        isInCooldown: true,
        cooldownRemaining: cooldownDuration,
        nextPauseAvailable: new Date(Date.now() + cooldownDuration * 1000),
        cooldownReason: "frequent_pausing",
        canOverride: keyholderOverrides.canOverrideCooldown,
        adaptiveDuration: cooldownDuration,
      });
    }
  }, [keyholderOverrides.canOverrideCooldown]);

  const resumeSession = useCallback(async (): Promise<void> => {
    if (!canResume) {
      throw new Error("Cannot resume: session is not paused");
    }

    try {
      logger.debug("Resuming session", { sessionId });

      const resumeTime = new Date();
      const pauseDuration = calculatePauseDuration(pauseStatus.pauseStartTime, resumeTime);

      // Update pause status
      setPauseStatus((prev) => ({
        ...prev,
        isPaused: false,
        pauseStartTime: undefined,
        pauseReason: undefined,
        canResume: false,
        pauseDuration: 0,
      }));

      // Update history
      updatePauseHistoryOnResume(resumeTime, pauseDuration, setPauseHistory);

      // Start cooldown period
      const cooldownDuration = calculateCooldownDuration(pauseAnalytics, pauseDuration);
      startCooldownIfNeeded(cooldownDuration);

      logger.info("Session resumed successfully", { sessionId, pauseDuration });
    } catch (error) {
      logger.error("Failed to resume session", { error });
      throw error;
    }
  }, [
    canResume,
    sessionId,
    pauseStatus,
    pauseAnalytics,
    calculatePauseDuration,
    updatePauseHistoryOnResume,
    startCooldownIfNeeded,
  ]);

  // ==================== ENHANCED ACTIONS ====================

  const requestEmergencyPause = useCallback(
    async (reason: string): Promise<PauseRequestStatus> => {
      try {
        logger.debug("Requesting emergency pause", { sessionId, reason });

        // Emergency pauses can bypass cooldown
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
      } catch (error) {
        logger.error("Failed to request emergency pause", { error });
        return {
          approved: false,
          reason: error instanceof Error ? error.message : "Unknown error",
          requestId: `emergency_${Date.now()}`,
        };
      }
    },
    [sessionId, cooldownState.isInCooldown, pauseSession],
  );

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
        logger.debug("Requesting cooldown override", {
          sessionId,
          justification,
        });

        // This would send a request to the keyholder
        // For now, return pending status
        return {
          approved: false,
          reason: "Override request sent to keyholder",
          requestId: `override_${Date.now()}`,
          overrideType: "cooldown",
        };
      } catch (error) {
        logger.error("Failed to request cooldown override", { error });
        return {
          approved: false,
          reason: error instanceof Error ? error.message : "Unknown error",
          requestId: `override_${Date.now()}`,
          overrideType: "cooldown",
        };
      }
    },
    [sessionId, relationshipId],
  );

  // ==================== KEYHOLDER ACTIONS ====================

  const keyholderForcePause = useCallback(
    async (reason: string): Promise<void> => {
      if (!keyholderOverrides.canForcePause) {
        throw new Error("Keyholder does not have force pause permissions");
      }

      try {
        logger.debug("Keyholder forcing pause", { sessionId, reason });

        const pauseTime = new Date();

        setPauseStatus((prev) => ({
          ...prev,
          isPaused: true,
          pauseStartTime: pauseTime,
          pauseReason: "keyholder_request",
          canResume: true,
          pauseCount: prev.pauseCount + 1,
        }));

        // Add to history
        const newHistoryEntry: PauseHistoryEntry = {
          id: `kh_pause_${Date.now()}`,
          sessionId,
          startTime: pauseTime,
          duration: 0,
          reason,
          initiatedBy: "keyholder",
          wasEmergency: false,
        };

        setPauseHistory((prev) => [...prev, newHistoryEntry]);

        logger.info("Keyholder force pause successful", { sessionId });
      } catch (error) {
        logger.error("Failed to execute keyholder force pause", { error });
        throw error;
      }
    },
    [keyholderOverrides.canForcePause, sessionId],
  );

  const keyholderForceResume = useCallback(
    async (reason: string): Promise<void> => {
      if (!keyholderOverrides.canForceResume) {
        throw new Error("Keyholder does not have force resume permissions");
      }

      try {
        logger.debug("Keyholder forcing resume", { sessionId, reason });
        await resumeSession();
        logger.info("Keyholder force resume successful", { sessionId });
      } catch (error) {
        logger.error("Failed to execute keyholder force resume", { error });
        throw error;
      }
    },
    [keyholderOverrides.canForceResume, sessionId, resumeSession],
  );

  const keyholderOverrideCooldown = useCallback(
    async (reason: string): Promise<void> => {
      if (!keyholderOverrides.canOverrideCooldown) {
        throw new Error(
          "Keyholder does not have cooldown override permissions",
        );
      }

      try {
        logger.debug("Keyholder overriding cooldown", { sessionId, reason });

        setCooldownState((prev) => ({
          ...prev,
          isInCooldown: false,
          cooldownRemaining: 0,
          nextPauseAvailable: null,
        }));

        logger.info("Keyholder cooldown override successful", { sessionId });
      } catch (error) {
        logger.error("Failed to execute keyholder cooldown override", {
          error,
        });
        throw error;
      }
    },
    [keyholderOverrides.canOverrideCooldown, sessionId],
  );

  // ==================== ANALYTICS ====================

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
      overrideFrequency: 0, // Calculate from history
      adaptiveAdjustments: 0, // Calculate from history
    };
  }, [pauseHistory, cooldownState]);

  // ==================== RETURN HOOK INTERFACE ====================

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
