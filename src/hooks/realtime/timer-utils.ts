/**
 * Timer utility helper functions
 */
import {
  LiveTimer,
  TimerType,
  TimerStatus,
  LiveTimerState,
  TimerSync,
} from "../../types/realtime";

// Helper function to get server time
export async function getServerTime(): Promise<Date> {
  try {
    return new Date(); // Fallback to client time
  } catch {
    return new Date();
  }
}

// Helper function to save timer to backend
export async function saveTimer(_timer: LiveTimer): Promise<void> {
  // In real implementation, save to backend
}

// Helper function to create timer sync record
export const createTimerSync = async (timerId: string): Promise<TimerSync> => {
  const now = new Date();
  return {
    timerId,
    lastSync: now,
    serverTime: await getServerTime(),
    clientOffset: 0,
    syncAccuracy: 1.0,
  };
};

// Helper function to create new timer
interface CreateTimerParams {
  userId: string;
  relationshipId?: string;
  type: TimerType;
  duration: number;
  title: string;
  description?: string;
  canPause?: boolean;
  canStop?: boolean;
  canExtend?: boolean;
  isKeyholderControlled?: boolean;
  keyholderUserId?: string;
  sessionId?: string;
  taskId?: string;
}

export const createNewTimer = ({
  userId,
  relationshipId,
  type,
  duration,
  title,
  description,
  canPause = true,
  canStop = true,
  canExtend = false,
  isKeyholderControlled = false,
  keyholderUserId,
  sessionId,
  taskId,
}: CreateTimerParams): LiveTimer => {
  const now = new Date();
  return {
    id: `timer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    status: TimerStatus.STOPPED,
    startTime: now,
    currentTime: now,
    duration,
    elapsed: 0,
    remaining: duration,
    isPaused: false,
    totalPauseTime: 0,
    userId,
    relationshipId,
    title,
    description,
    canPause,
    canStop,
    canExtend,
    isKeyholderControlled,
    keyholderUserId,
    sessionId,
    taskId,
  };
};

// Helper function to calculate computed values
export const calculateComputedValues = (activeTimers: LiveTimer[]) => {
  const runningCount = activeTimers.filter(
    (t) => t.status === TimerStatus.RUNNING,
  ).length;
  const pausedCount = activeTimers.filter(
    (t) => t.status === TimerStatus.PAUSED,
  ).length;
  const completedCount = activeTimers.filter(
    (t) => t.status === TimerStatus.COMPLETED,
  ).length;

  const totalActiveTime = activeTimers
    .filter((t) => t.status === TimerStatus.RUNNING)
    .reduce((total, timer) => total + timer.elapsed, 0);

  const longestRunningTimer =
    activeTimers
      .filter((t) => t.status === TimerStatus.RUNNING)
      .sort((a, b) => b.elapsed - a.elapsed)[0] || null;

  return {
    runningCount,
    pausedCount,
    completedCount,
    totalActiveTime,
    longestRunningTimer,
  };
};
