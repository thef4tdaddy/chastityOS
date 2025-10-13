import type { User } from "@/types/core";

interface PauseState {
  canPause: boolean;
  cooldownRemaining?: number;
  lastPauseTime?: Date;
  nextPauseAvailable?: Date;
}

// Custom hook for mock data (DEMO VERSION - keep for #308)
// Real version uses useSessionActions + useSession
export const useMockData = (user: User | null | undefined) => {
  // Mock pause state data for now
  const pauseState: PauseState = {
    canPause: true,
    cooldownRemaining: undefined,
    lastPauseTime: undefined,
    nextPauseAvailable: undefined,
  };
  const pauseStateLoading = false;
  const pauseStateError = null;
  const refreshPauseState = () => {};

  // Mock session data - replace with real session management
  const mockSessionData = {
    isCageOn: true,
    isPaused: false,
    remainingGoalTime: 3600,
    keyholderName: "Keyholder",
    savedSubmissivesName: "Submissive",
    requiredKeyholderDurationSeconds: 7200,
    mainChastityDisplayTime: 3600,
    topBoxLabel: "Total Locked Time",
    topBoxTime: "1d 2h 3m",
    livePauseDuration: 0,
    accumulatedPauseTimeThisSession: 0,
    timeCageOff: 0,
    totalChastityTime: 86400,
    totalTimeCageOff: 0,
    showRestoreSessionPrompt: false,
    pauseCooldownMessage: null,
    denialCooldownActive: false,
    hasPendingReleaseRequest: false,
    isGoalActive: true,
    isHardcoreGoal: false,
    showReasonModal: false,
    showPauseReasonModal: false,
    useRealTimeTimer: false, // Feature flag for real-time timer
    sessionId: "mock-session-123",
    userId: user?.uid || "mock-user-123",
  };

  // Override pause state for demo - show that pause is available
  const mockPauseState = {
    canPause: true,
    lastPauseTime: undefined,
    nextPauseAvailable: undefined,
    cooldownRemaining: undefined,
  };

  return {
    pauseState,
    pauseStateLoading,
    pauseStateError,
    refreshPauseState,
    ...mockSessionData,
    mockPauseState,
  };
};
