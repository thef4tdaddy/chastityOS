/**
 * Pause/Resume Hook Helpers
 * Helper functions for pause/resume operations
 */
import type {
  PauseStatus,
  PauseHistoryEntry,
  PauseReason,
  CooldownState,
  KeyholderOverrideCapabilities,
} from "../../types/pauseResume";
import { serviceLogger } from "../logging";

const logger = serviceLogger("pauseResumeHelpers");

export function createPauseHistoryEntry(
  sessionId: string,
  pauseTime: Date,
  reason: PauseReason,
  initiatedBy: "submissive" | "keyholder" | "system" = "submissive"
): PauseHistoryEntry {
  return {
    id: `pause_${Date.now()}`,
    sessionId,
    startTime: pauseTime,
    duration: 0,
    reason,
    initiatedBy,
    wasEmergency: reason === "emergency",
  };
}

export function calculatePauseDuration(
  pauseStartTime: Date | undefined,
  resumeTime: Date
): number {
  return pauseStartTime
    ? Math.floor((resumeTime.getTime() - pauseStartTime.getTime()) / 1000)
    : 0;
}

export function updatePauseStatusOnStart(
  pauseTime: Date,
  reason: PauseReason,
  currentStatus: PauseStatus
): PauseStatus {
  return {
    ...currentStatus,
    isPaused: true,
    pauseStartTime: pauseTime,
    pauseReason: reason,
    canResume: true,
    pauseCount: currentStatus.pauseCount + 1,
  };
}

export function updatePauseStatusOnResume(
  currentStatus: PauseStatus
): PauseStatus {
  return {
    ...currentStatus,
    isPaused: false,
    pauseStartTime: undefined,
    pauseReason: undefined,
    canResume: false,
    pauseDuration: 0,
  };
}

export function updatePauseHistoryOnResume(
  history: PauseHistoryEntry[],
  resumeTime: Date,
  pauseDuration: number
): PauseHistoryEntry[] {
  const lastPause = history[history.length - 1];
  if (lastPause && !lastPause.endTime) {
    return history.map((entry, index) =>
      index === history.length - 1
        ? { ...entry, endTime: resumeTime, duration: pauseDuration }
        : entry,
    );
  }
  return history;
}

export function createCooldownState(
  cooldownDuration: number,
  canOverride: boolean
): CooldownState {
  return {
    isInCooldown: true,
    cooldownRemaining: cooldownDuration,
    nextPauseAvailable: new Date(Date.now() + cooldownDuration * 1000),
    cooldownReason: "frequent_pausing",
    canOverride,
    adaptiveDuration: cooldownDuration,
  };
}

export function createKeyholderOverrides(): KeyholderOverrideCapabilities {
  return {
    canOverrideCooldown: true,
    canForcePause: true,
    canForceResume: true,
    canModifyCooldownDuration: true,
    requiresReason: true,
  };
}

export function updateCooldownProgress(
  currentState: CooldownState
): CooldownState {
  const newRemaining = Math.max(0, currentState.cooldownRemaining - 1);

  if (newRemaining === 0) {
    return {
      ...currentState,
      isInCooldown: false,
      cooldownRemaining: 0,
      nextPauseAvailable: null,
    };
  }

  return {
    ...currentState,
    cooldownRemaining: newRemaining,
  };
}

export function clearCooldownState(currentState: CooldownState): CooldownState {
  return {
    ...currentState,
    isInCooldown: false,
    cooldownRemaining: 0,
    nextPauseAvailable: null,
  };
}
