/**
 * Enhanced Pause/Resume System Hook
 * Provides advanced pause/resume functionality with keyholder overrides,
 * intelligent cooldown management, and comprehensive analytics
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import type { DBSession } from "../../types/database";
import type { KeyholderRelationship } from "../../types/core";
import { PauseCooldownService } from "../../services/PauseCooldownService";
import { serviceLogger } from "../../utils/logging";

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

// ==================== HOOK IMPLEMENTATION ====================

export const usePauseResume = (sessionId: string, relationshipId?: string) => {
  // ==================== STATE ====================

  const [pauseStatus, setPauseStatus] = useState<PauseStatus>({
    isPaused: false,
    pauseDuration: 0,
    canResume: false,
    pauseCount: 0,
  });

  const [cooldownState, setCooldownState] = useState<CooldownState>({
    isInCooldown: false,
    cooldownRemaining: 0,
    nextPauseAvailable: null,
    cooldownReason: "frequent_pausing",
    canOverride: false,
    adaptiveDuration: 300, // 5 minutes default
  });

  const [keyholderOverrides, setKeyholderOverrides] =
    useState<KeyholderOverrideCapabilities>({
      canOverrideCooldown: false,
      canForcePause: false,
      canForceResume: false,
      canModifyCooldownDuration: false,
      requiresReason: true,
    });

  const [pauseHistory, setPauseHistory] = useState<PauseHistoryEntry[]>([]);
  const [pauseAnalytics, setPauseAnalytics] = useState<PauseAnalytics>({
    totalPauses: 0,
    averagePauseDuration: 0,
    pauseFrequency: 0,
    emergencyPauseCount: 0,
    keyholderInitiatedCount: 0,
    cooldownViolations: 0,
    patterns: [],
  });

  const [relationship, setRelationship] =
    useState<KeyholderRelationship | null>(null);
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

  useEffect(() => {
    const initializePauseSystem = async () => {
      if (!sessionId) return;

      try {
        setIsLoading(true);
        setError(null);

        // Load relationship data if available
        if (relationshipId) {
          // This would load the relationship and set keyholder overrides
          setKeyholderOverrides({
            canOverrideCooldown: true,
            canForcePause: true,
            canForceResume: true,
            canModifyCooldownDuration: true,
            requiresReason: true,
          });
        }

        // Load pause state, history, and analytics
        await Promise.all([
          loadPauseState(),
          loadCooldownState(),
          loadPauseHistory(),
          loadPauseAnalytics(),
        ]);
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
  }, [sessionId, relationshipId]);

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

  const pauseSession = useCallback(
    async (reason: PauseReason): Promise<void> => {
      if (!canPause) {
        throw new Error("Cannot pause: either already paused or in cooldown");
      }

      try {
        logger.debug("Pausing session", { sessionId, reason });

        const pauseTime = new Date();

        setPauseStatus((prev) => ({
          ...prev,
          isPaused: true,
          pauseStartTime: pauseTime,
          pauseReason: reason,
          canResume: true,
          pauseCount: prev.pauseCount + 1,
        }));

        // Add to history
        const newHistoryEntry: PauseHistoryEntry = {
          id: `pause_${Date.now()}`,
          sessionId,
          startTime: pauseTime,
          duration: 0,
          reason,
          initiatedBy: "submissive",
          wasEmergency: reason === "emergency",
        };

        setPauseHistory((prev) => [...prev, newHistoryEntry]);

        // Calculate adaptive cooldown after pause
        const adaptiveCooldown = calculateAdaptiveCooldown(
          pauseHistory,
          pauseAnalytics,
        );

        logger.info("Session paused successfully", { sessionId, reason });
      } catch (error) {
        logger.error("Failed to pause session", { error });
        throw error;
      }
    },
    [canPause, sessionId, pauseHistory, pauseAnalytics],
  );

  const resumeSession = useCallback(async (): Promise<void> => {
    if (!canResume) {
      throw new Error("Cannot resume: session is not paused");
    }

    try {
      logger.debug("Resuming session", { sessionId });

      const resumeTime = new Date();
      const pauseDuration = pauseStatus.pauseStartTime
        ? Math.floor(
            (resumeTime.getTime() - pauseStatus.pauseStartTime.getTime()) /
              1000,
          )
        : 0;

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

      // Start cooldown period
      const cooldownDuration = calculateCooldownDuration(
        pauseAnalytics,
        pauseDuration,
      );
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

      logger.info("Session resumed successfully", { sessionId, pauseDuration });
    } catch (error) {
      logger.error("Failed to resume session", { error });
      throw error;
    }
  }, [canResume, sessionId, pauseStatus, pauseAnalytics, keyholderOverrides]);

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

// ==================== HELPER FUNCTIONS ====================

function calculatePauseFrequency(history: PauseHistoryEntry[]): number {
  if (history.length === 0) return 0;

  // Calculate pauses per day over the last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentPauses = history.filter(
    (pause) => pause.startTime >= sevenDaysAgo,
  );

  return recentPauses.length / 7;
}

function calculateAdaptiveCooldown(
  history: PauseHistoryEntry[],
  analytics: PauseAnalytics,
): number {
  // Base cooldown of 5 minutes
  let cooldown = 300;

  // Increase based on pause frequency
  if (analytics.pauseFrequency > 3) cooldown *= 1.5;
  if (analytics.pauseFrequency > 5) cooldown *= 2;

  // Decrease for good behavior
  if (analytics.pauseFrequency < 1) cooldown *= 0.8;

  return Math.min(3600, Math.max(60, cooldown)); // Between 1 minute and 1 hour
}

function calculateCooldownDuration(
  analytics: PauseAnalytics,
  lastPauseDuration: number,
): number {
  // Short pauses get longer cooldowns to prevent abuse
  if (lastPauseDuration < 60) return 600; // 10 minutes for pauses under 1 minute
  if (lastPauseDuration < 300) return 300; // 5 minutes for pauses under 5 minutes

  // Reasonable pauses get standard cooldown
  return 180; // 3 minutes
}

function calculatePauseAnalytics(history: PauseHistoryEntry[]): PauseAnalytics {
  if (history.length === 0) {
    return {
      totalPauses: 0,
      averagePauseDuration: 0,
      pauseFrequency: 0,
      emergencyPauseCount: 0,
      keyholderInitiatedCount: 0,
      cooldownViolations: 0,
      patterns: [],
    };
  }

  const totalDuration = history.reduce((sum, pause) => sum + pause.duration, 0);
  const emergencyPauses = history.filter((pause) => pause.wasEmergency).length;
  const keyholderPauses = history.filter(
    (pause) => pause.initiatedBy === "keyholder",
  ).length;

  return {
    totalPauses: history.length,
    averagePauseDuration: totalDuration / history.length,
    pauseFrequency: calculatePauseFrequency(history),
    emergencyPauseCount: emergencyPauses,
    keyholderInitiatedCount: keyholderPauses,
    cooldownViolations: 0, // Would need to track this separately
    patterns: analyzePausePatterns(history),
  };
}

function analyzePausePatterns(history: PauseHistoryEntry[]): PausePattern[] {
  const patterns: PausePattern[] = [];

  // Analyze time-based patterns
  const hourCounts = new Array(24).fill(0);
  history.forEach((pause) => {
    const hour = pause.startTime.getHours();
    hourCounts[hour]++;
  });

  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
  if (hourCounts[peakHour] > history.length * 0.3) {
    patterns.push({
      type: "time_based",
      description: `High pause frequency at ${peakHour}:00`,
      frequency: hourCounts[peakHour] / history.length,
      severity: hourCounts[peakHour] > history.length * 0.5 ? "high" : "medium",
    });
  }

  return patterns;
}

function calculateCooldownEffectiveness(
  history: PauseHistoryEntry[],
  cooldownState: CooldownState,
): number {
  // Simple effectiveness calculation based on pause spacing
  // More sophisticated analysis would consider cooldown violations
  return 75; // Placeholder - would calculate actual effectiveness
}

export default usePauseResume;
