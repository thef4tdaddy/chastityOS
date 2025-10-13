/**
 * Tracker props builders
 * Helper functions to build props for tracker components
 */

import type { DBSession, DBGoal } from "@/types/database";

interface MockTrackerData {
  isCageOn: boolean;
  isPaused: boolean;
  sessionId?: string;
  userId?: string;
  isGoalActive?: boolean;
  isHardcoreGoal?: boolean;
  requiredKeyholderDurationSeconds?: number;
  hasPendingReleaseRequest?: boolean;
  mainChastityDisplayTime?: number;
  totalChastityTime: number;
  totalTimeCageOff?: number;
  topBoxLabel?: string;
  timeCageOff?: number;
  useRealTimeTimer?: boolean;
  remainingGoalTime?: number;
  keyholderName?: string;
  savedSubmissivesName?: string;
  topBoxTime?: string;
  livePauseDuration?: number;
  accumulatedPauseTimeThisSession?: number;
}

interface TrackerStatsPropsReal {
  topBoxLabel: string;
  timeCageOff: number;
  isCageOn: boolean;
  totalChastityTime: number;
  totalTimeCageOff: number;
  isPaused: boolean;
  currentSession: DBSession | null;
  personalGoal: DBGoal | undefined;
  mainChastityDisplayTime: undefined;
  topBoxTime: undefined;
  livePauseDuration: undefined;
  accumulatedPauseTimeThisSession: undefined;
}

interface TrackerStatsPropsParams {
  isActive: boolean;
  isPaused: boolean;
  realSession: DBSession | null;
  totalChastityTime: number;
  totalCageOffTime: number;
  personalGoal: DBGoal | undefined;
}

/**
 * Build TrackerStats props for real session mode
 */
export const buildTrackerStatsProps = (
  params: TrackerStatsPropsParams,
): TrackerStatsPropsReal => {
  return {
    topBoxLabel: "Total Locked Time",
    timeCageOff: 0,
    isCageOn: params.isActive,
    totalChastityTime: params.totalChastityTime,
    totalTimeCageOff: params.totalCageOffTime,
    isPaused: params.isPaused,
    currentSession: params.realSession,
    personalGoal: params.personalGoal,
    mainChastityDisplayTime: undefined,
    topBoxTime: undefined,
    livePauseDuration: undefined,
    accumulatedPauseTimeThisSession: undefined,
  };
};

interface TrackerDataParams {
  isActive: boolean;
  isPaused: boolean;
  sessionId: string | null;
  userId: string | undefined;
  goals: {
    active?: DBGoal[];
    keyholderAssigned?: DBGoal[];
  };
  keyholderGoal: DBGoal | undefined;
  personalGoal: DBGoal | undefined;
  isHardcoreMode: boolean;
  duration: number;
}

/**
 * Build tracker data object for real session mode
 */
export const buildTrackerData = (params: TrackerDataParams) => {
  return {
    isCageOn: params.isActive,
    isPaused: params.isPaused,
    sessionId: params.sessionId || undefined,
    userId: params.userId,
    keyholderUserId: undefined,
    isGoalActive:
      (params.goals?.active?.length ?? 0) > 0 ||
      !!params.keyholderGoal ||
      !!params.personalGoal,
    isHardcoreGoal: params.isHardcoreMode,
    requiredKeyholderDurationSeconds: params.keyholderGoal?.targetValue || 0,
    hasPendingReleaseRequest: false,
    mainChastityDisplayTime: params.duration,
    totalChastityTime: params.duration,
  };
};

/**
 * Build TrackerHeader props for real session mode
 */
export const buildTrackerHeaderProps = (
  goals: { active?: DBGoal[]; keyholderAssigned?: DBGoal[] },
  isActive: boolean,
) => {
  const hasActiveGoals = goals?.active && goals.active.length > 0;
  const hasKeyholderGoals =
    goals?.keyholderAssigned && goals.keyholderAssigned.length > 0;

  return {
    remainingGoalTime:
      hasActiveGoals && goals.active?.[0]
        ? goals.active[0].targetValue - goals.active[0].currentValue
        : 0,
    keyholderName: hasKeyholderGoals ? "Keyholder" : "",
    savedSubmissivesName: "",
    requiredKeyholderDurationSeconds:
      hasKeyholderGoals && goals.keyholderAssigned?.[0]
        ? goals.keyholderAssigned[0].targetValue
        : 0,
    isCageOn: isActive,
    denialCooldownActive: false,
    pauseCooldownMessage: null,
  };
};

/**
 * Build mock tracker data
 */
export const buildMockTrackerData = (mockData: MockTrackerData) => {
  return {
    isCageOn: mockData.isCageOn,
    isPaused: mockData.isPaused,
    sessionId: mockData.sessionId,
    userId: mockData.userId,
    isGoalActive: mockData.isGoalActive ?? false,
    isHardcoreGoal: mockData.isHardcoreGoal ?? false,
    requiredKeyholderDurationSeconds:
      mockData.requiredKeyholderDurationSeconds ?? 0,
    hasPendingReleaseRequest: mockData.hasPendingReleaseRequest ?? false,
    mainChastityDisplayTime: mockData.mainChastityDisplayTime,
    totalChastityTime: mockData.totalChastityTime,
  };
};

/**
 * Build mock tracker stats props
 */
export const buildMockTrackerStatsProps = (
  mockData: MockTrackerData,
  currentSession?: DBSession | null,
) => {
  const baseProps = {
    topBoxLabel: mockData.topBoxLabel,
    timeCageOff: mockData.timeCageOff,
    isCageOn: mockData.isCageOn,
    totalChastityTime: mockData.totalChastityTime,
    totalTimeCageOff: mockData.totalTimeCageOff,
    isPaused: mockData.isPaused,
  };

  if (mockData.useRealTimeTimer) {
    return {
      ...baseProps,
      currentSession,
      mainChastityDisplayTime: undefined,
      topBoxTime: undefined,
      livePauseDuration: undefined,
      accumulatedPauseTimeThisSession: undefined,
    };
  }

  return {
    ...baseProps,
    currentSession: undefined,
    mainChastityDisplayTime: mockData.mainChastityDisplayTime,
    topBoxTime: mockData.topBoxTime,
    livePauseDuration: mockData.livePauseDuration,
    accumulatedPauseTimeThisSession: mockData.accumulatedPauseTimeThisSession,
  };
};
