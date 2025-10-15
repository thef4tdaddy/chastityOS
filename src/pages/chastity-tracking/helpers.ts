import { logger } from "@/utils/logging";
import {
  buildTrackerStatsProps,
  buildTrackerData,
  buildTrackerHeaderProps,
  buildMockTrackerData,
  buildMockTrackerStatsProps,
} from "@/utils/tracker/trackerProps";
import type { DBGoal, DBSession } from "@/types/database";

// Helper to check if pause buttons should show
export const shouldShowPauseButtons = (
  useRealSessions: boolean,
  isActive: boolean,
) => useRealSessions && isActive;

// Helper to get action button callbacks
export const getActionButtonCallbacks = (
  useRealSessions: boolean,
  startSession: () => Promise<void>,
  endSession: (reason?: string) => Promise<void>,
  handleEmergencyUnlock: () => Promise<void>,
) => ({
  onStartSession: useRealSessions ? startSession : undefined,
  onEndSession: useRealSessions
    ? () => endSession("User ended session")
    : undefined,
  onBegForRelease: useRealSessions
    ? () => logger.info("Beg for release - TODO: implement")
    : undefined,
  onEmergencyUnlock: handleEmergencyUnlock,
});

interface RealTrackerData {
  trackerDataParams: {
    isActive: boolean;
    isPaused: boolean;
    sessionId: string | null;
    userId: string | undefined;
    goals: { active?: DBGoal[]; keyholderAssigned?: DBGoal[] };
    keyholderGoal: DBGoal | undefined;
    personalGoal: DBGoal | undefined;
    isHardcoreMode: boolean;
    duration: number;
  };
  statsParams: {
    isActive: boolean;
    isPaused: boolean;
    realSession: DBSession | null;
    totalChastityTime: number;
    totalCageOffTime: number;
    personalGoal: DBGoal | undefined;
  };
  goals?: { active?: DBGoal[]; keyholderAssigned?: DBGoal[] };
  isActive: boolean;
}

// Helper to build all component props at once
export const buildAllTrackerProps = (
  useRealSessions: boolean,
  realData: RealTrackerData | null,
  mockData: unknown,
  currentSession: unknown,
) => {
  const real = realData;
  const mock = mockData as {
    isCageOn: boolean;
    isPaused: boolean;
    remainingGoalTime?: number;
    keyholderName?: string;
    savedSubmissivesName?: string;
    requiredKeyholderDurationSeconds?: number;
    totalChastityTime: number;
    denialCooldownActive?: boolean;
    pauseCooldownMessage?: string;
    [key: string]: unknown;
  };
  const trackerData =
    useRealSessions && real
      ? buildTrackerData(real.trackerDataParams)
      : buildMockTrackerData(mock);

  const trackerStatsProps =
    useRealSessions && real
      ? buildTrackerStatsProps(real.statsParams)
      : buildMockTrackerStatsProps(
          mock,
          currentSession as DBSession | null | undefined,
        );

  const trackerHeaderProps =
    useRealSessions && real
      ? buildTrackerHeaderProps(real.goals || {}, real.isActive)
      : {
          remainingGoalTime: mock.remainingGoalTime ?? 0,
          keyholderName: mock.keyholderName ?? "",
          savedSubmissivesName: mock.savedSubmissivesName ?? "",
          requiredKeyholderDurationSeconds:
            mock.requiredKeyholderDurationSeconds ?? 0,
          isCageOn: mock.isCageOn,
          denialCooldownActive: mock.denialCooldownActive ?? false,
          pauseCooldownMessage: mock.pauseCooldownMessage ?? "",
        };

  return { trackerData, trackerStatsProps, trackerHeaderProps };
};

// Helper to build real tracker data params
export const buildRealTrackerDataParams = (params: {
  isActive: boolean;
  isPaused: boolean;
  sessionId: string | null;
  userId: string | undefined;
  goals: { active: DBGoal[] } | null;
  keyholderGoal: DBGoal | null;
  personalGoal: DBGoal | null;
  isHardcoreMode: boolean;
  duration: number;
}): RealTrackerData => {
  const {
    isActive,
    isPaused,
    sessionId,
    userId,
    goals,
    keyholderGoal,
    personalGoal,
    isHardcoreMode,
    duration,
  } = params;

  const goalsData = goals
    ? { active: goals.active, keyholderAssigned: [] }
    : { active: [], keyholderAssigned: [] };

  return {
    trackerDataParams: {
      isActive,
      isPaused,
      sessionId,
      userId,
      goals: goalsData,
      keyholderGoal: keyholderGoal ?? undefined,
      personalGoal: personalGoal ?? undefined,
      isHardcoreMode,
      duration,
    },
    statsParams: {
      isActive,
      isPaused,
      realSession: null, // Will be set by caller
      totalChastityTime: 0, // Will be set by caller
      totalCageOffTime: 0, // Will be set by caller
      personalGoal: personalGoal ?? undefined,
    },
    goals: goals ? { active: goals.active, keyholderAssigned: [] } : undefined,
    isActive,
  };
};
