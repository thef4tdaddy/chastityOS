/**
 * useKeyholderRewards Hook
 * Manages the reward and punishment system for keyholders
 * Allows modifying session times, assigning achievements, and managing consequences
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuthState } from "../../contexts";
import { serviceLogger } from "../../utils/logging";

const logger = serviceLogger("useKeyholderRewards");

// ==================== TYPES ====================

export type RewardType =
  | "time_reduction"
  | "early_release"
  | "achievement_unlock"
  | "task_completion"
  | "special_privilege";
export type PunishmentType =
  | "time_addition"
  | "goal_increase"
  | "task_assignment"
  | "restriction"
  | "privilege_removal";

export interface RewardImpact {
  timeChangeSeconds?: number;
  goalAdjustment?: number;
  achievementId?: string;
  privilegeId?: string;
  taskData?: any;
}

export interface PunishmentImpact {
  timeChangeSeconds?: number;
  goalAdjustment?: number;
  restrictionId?: string;
  taskData?: any;
  privilegeRemoval?: string;
}

export interface RewardAction {
  id: string;
  type: RewardType;
  name: string;
  description: string;
  impact: RewardImpact;
  requiresReason: boolean;
  cooldownMinutes?: number;
  maxUsesPerDay?: number;
  pointsCost?: number;
}

export interface PunishmentAction {
  id: string;
  type: PunishmentType;
  name: string;
  description: string;
  impact: PunishmentImpact;
  requiresReason: boolean;
  cooldownMinutes?: number;
  maxUsesPerDay?: number;
  severity: "minor" | "moderate" | "severe";
}

export interface RewardPunishmentHistory {
  id: string;
  keyholderId: string;
  submissiveId: string;
  type: "reward" | "punishment";
  actionId: string;
  actionName: string;
  reason: string;
  impact: RewardImpact | PunishmentImpact;
  timestamp: Date;
  appliedBy: string;
  sessionContext?: {
    sessionId?: string;
    sessionTime?: number;
    goalProgress?: number;
  };
}

export interface TaskAssignment {
  title: string;
  description: string;
  dueDate?: Date;
  priority: "low" | "medium" | "high" | "urgent";
  consequence?: {
    type: "reward" | "punishment";
    description: string;
  };
}

export interface RewardPunishmentSettings {
  maxTimeChangeMinutes: number;
  requireReasonForPunishments: boolean;
  requireReasonForRewards: boolean;
  cooldownBetweenActions: number;
  maxActionsPerHour: number;
  allowNegativeTime: boolean;
  autoLogActions: boolean;
}

export interface RewardPunishmentSystem {
  availableRewards: RewardAction[];
  availablePunishments: PunishmentAction[];
  recentActions: RewardPunishmentHistory[];
  settings: RewardPunishmentSettings;
  usageStats: {
    totalRewards: number;
    totalPunishments: number;
    rewardsToday: number;
    punishmentsToday: number;
    lastAction: Date | null;
  };
}

export interface RewardPunishmentState {
  system: RewardPunishmentSystem;
  isLoading: boolean;
  isApplying: boolean;
  error: string | null;
  lastAppliedAction: RewardPunishmentHistory | null;
}

export interface RewardPunishmentActions {
  // Core actions
  applyReward: (
    rewardId: string,
    reason?: string,
    customImpact?: Partial<RewardImpact>,
  ) => Promise<void>;
  applyPunishment: (
    punishmentId: string,
    reason: string,
    customImpact?: Partial<PunishmentImpact>,
  ) => Promise<void>;

  // Time modifications
  addSessionTime: (minutes: number, reason: string) => Promise<void>;
  reduceSessionTime: (minutes: number, reason: string) => Promise<void>;

  // Achievement system
  awardAchievement: (achievementId: string, reason?: string) => Promise<void>;

  // Task system
  assignTask: (task: TaskAssignment) => Promise<void>;

  // History and audit
  getHistory: (days?: number) => RewardPunishmentHistory[];
  clearHistory: () => Promise<void>;

  // Utilities
  canApplyAction: (actionId: string, type: "reward" | "punishment") => boolean;
  getActionCooldown: (actionId: string) => number;
  resetError: () => void;
}

// ==================== CONSTANTS ====================

const DEFAULT_SETTINGS: RewardPunishmentSettings = {
  maxTimeChangeMinutes: 120, // 2 hours max change
  requireReasonForPunishments: true,
  requireReasonForRewards: false,
  cooldownBetweenActions: 5, // 5 minutes between actions
  maxActionsPerHour: 10,
  allowNegativeTime: false,
  autoLogActions: true,
};

const DEFAULT_REWARDS: RewardAction[] = [
  {
    id: "time_reduction_30",
    type: "time_reduction",
    name: "Time Reduction (30 min)",
    description: "Reduce remaining session time by 30 minutes",
    impact: { timeChangeSeconds: -1800 },
    requiresReason: false,
    cooldownMinutes: 15,
    maxUsesPerDay: 3,
  },
  {
    id: "time_reduction_60",
    type: "time_reduction",
    name: "Time Reduction (1 hour)",
    description: "Reduce remaining session time by 1 hour",
    impact: { timeChangeSeconds: -3600 },
    requiresReason: false,
    cooldownMinutes: 30,
    maxUsesPerDay: 2,
  },
  {
    id: "early_release",
    type: "early_release",
    name: "Early Release",
    description: "End the current session immediately",
    impact: { timeChangeSeconds: 0 }, // Special handling
    requiresReason: true,
    cooldownMinutes: 60,
    maxUsesPerDay: 1,
  },
  {
    id: "task_completion_bonus",
    type: "task_completion",
    name: "Task Completion Bonus",
    description: "Reward for excellent task completion",
    impact: { timeChangeSeconds: -900 }, // 15 minutes
    requiresReason: false,
    cooldownMinutes: 0,
    maxUsesPerDay: 5,
  },
];

const DEFAULT_PUNISHMENTS: PunishmentAction[] = [
  {
    id: "time_addition_30",
    type: "time_addition",
    name: "Time Addition (30 min)",
    description: "Add 30 minutes to the current session",
    impact: { timeChangeSeconds: 1800 },
    requiresReason: true,
    cooldownMinutes: 15,
    maxUsesPerDay: 5,
    severity: "minor",
  },
  {
    id: "time_addition_60",
    type: "time_addition",
    name: "Time Addition (1 hour)",
    description: "Add 1 hour to the current session",
    impact: { timeChangeSeconds: 3600 },
    requiresReason: true,
    cooldownMinutes: 30,
    maxUsesPerDay: 3,
    severity: "moderate",
  },
  {
    id: "time_addition_120",
    type: "time_addition",
    name: "Time Addition (2 hours)",
    description: "Add 2 hours to the current session",
    impact: { timeChangeSeconds: 7200 },
    requiresReason: true,
    cooldownMinutes: 60,
    maxUsesPerDay: 1,
    severity: "severe",
  },
  {
    id: "task_assignment_discipline",
    type: "task_assignment",
    name: "Discipline Task",
    description: "Assign a disciplinary task",
    impact: { taskData: { type: "discipline", priority: "high" } },
    requiresReason: true,
    cooldownMinutes: 0,
    maxUsesPerDay: 3,
    severity: "minor",
  },
];

// ==================== INITIAL STATE ====================

const initialSystem: RewardPunishmentSystem = {
  availableRewards: DEFAULT_REWARDS,
  availablePunishments: DEFAULT_PUNISHMENTS,
  recentActions: [],
  settings: DEFAULT_SETTINGS,
  usageStats: {
    totalRewards: 0,
    totalPunishments: 0,
    rewardsToday: 0,
    punishmentsToday: 0,
    lastAction: null,
  },
};

const initialState: RewardPunishmentState = {
  system: initialSystem,
  isLoading: false,
  isApplying: false,
  error: null,
  lastAppliedAction: null,
};

// ==================== UTILITIES ====================

const generateActionId = (): string => {
  return `rp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

const getActionUsagesToday = (
  history: RewardPunishmentHistory[],
  actionId: string,
): number => {
  return history.filter((h) => h.actionId === actionId && isToday(h.timestamp))
    .length;
};

// ==================== MAIN HOOK ====================

export const useKeyholderRewards = (relationshipId: string) => {
  const { user } = useAuthState();
  const [state, setState] = useState<RewardPunishmentState>(initialState);

  // ==================== COMPUTED VALUES ====================

  const computedValues = useMemo(() => {
    const { system } = state;
    const now = new Date();

    // Calculate permissions
    const canApplyRewards = user?.uid ? true : false; // TODO: Check actual permissions
    const canApplyPunishments = user?.uid ? true : false; // TODO: Check actual permissions

    // Calculate recent counts
    const last24Hours = system.recentActions.filter(
      (action) =>
        now.getTime() - action.timestamp.getTime() < 24 * 60 * 60 * 1000,
    );

    const recentRewardCount = last24Hours.filter(
      (action) => action.type === "reward",
    ).length;
    const recentPunishmentCount = last24Hours.filter(
      (action) => action.type === "punishment",
    ).length;

    return {
      canApplyRewards,
      canApplyPunishments,
      recentRewardCount,
      recentPunishmentCount,
      hasRecentActivity:
        system.usageStats.lastAction &&
        now.getTime() - system.usageStats.lastAction.getTime() < 60 * 60 * 1000, // Last hour
    };
  }, [state.system, user?.uid]);

  // ==================== ACTION VALIDATION ====================

  const canApplyAction = useCallback(
    (actionId: string, type: "reward" | "punishment"): boolean => {
      if (!user?.uid) return false;

      const actions =
        type === "reward"
          ? state.system.availableRewards
          : state.system.availablePunishments;
      const action = actions.find((a) => a.id === actionId);

      if (!action) return false;

      // Check daily usage limit
      if (action.maxUsesPerDay) {
        const usagesToday = getActionUsagesToday(
          state.system.recentActions,
          actionId,
        );
        if (usagesToday >= action.maxUsesPerDay) {
          return false;
        }
      }

      // Check cooldown
      if (action.cooldownMinutes) {
        const cooldownMs = action.cooldownMinutes * 60 * 1000;
        const lastUse = state.system.recentActions
          .filter((h) => h.actionId === actionId)
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

        if (lastUse && Date.now() - lastUse.timestamp.getTime() < cooldownMs) {
          return false;
        }
      }

      // Check hourly rate limit
      const lastHour = state.system.recentActions.filter(
        (action) => Date.now() - action.timestamp.getTime() < 60 * 60 * 1000,
      );

      if (lastHour.length >= state.system.settings.maxActionsPerHour) {
        return false;
      }

      return true;
    },
    [user?.uid, state.system],
  );

  const getActionCooldown = useCallback(
    (actionId: string): number => {
      const allActions = [
        ...state.system.availableRewards,
        ...state.system.availablePunishments,
      ];
      const action = allActions.find((a) => a.id === actionId);

      if (!action || !action.cooldownMinutes) return 0;

      const lastUse = state.system.recentActions
        .filter((h) => h.actionId === actionId)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

      if (!lastUse) return 0;

      const cooldownMs = action.cooldownMinutes * 60 * 1000;
      const timeSinceUse = Date.now() - lastUse.timestamp.getTime();

      return Math.max(0, cooldownMs - timeSinceUse);
    },
    [state.system],
  );

  // ==================== CORE ACTIONS ====================

  const applyReward = useCallback(
    async (
      rewardId: string,
      reason?: string,
      customImpact?: Partial<RewardImpact>,
    ): Promise<void> => {
      if (!user?.uid || !canApplyAction(rewardId, "reward")) {
        setState((prev) => ({
          ...prev,
          error: "Cannot apply reward: Permission denied or cooldown active",
        }));
        return;
      }

      const reward = state.system.availableRewards.find(
        (r) => r.id === rewardId,
      );
      if (!reward) {
        setState((prev) => ({ ...prev, error: "Reward not found" }));
        return;
      }

      if (reward.requiresReason && !reason) {
        setState((prev) => ({
          ...prev,
          error: "Reason required for this reward",
        }));
        return;
      }

      setState((prev) => ({ ...prev, isApplying: true, error: null }));

      try {
        logger.info("Applying reward", { rewardId, reason, relationshipId });

        // Create history entry
        const historyEntry: RewardPunishmentHistory = {
          id: generateActionId(),
          keyholderId: user.uid,
          submissiveId: relationshipId,
          type: "reward",
          actionId: rewardId,
          actionName: reward.name,
          reason: reason || "",
          impact: { ...reward.impact, ...customImpact },
          timestamp: new Date(),
          appliedBy: user.displayName || user.uid,
        };

        // TODO: Apply the actual reward impact (time change, achievement unlock, etc.)
        // This would integrate with session management, achievement system, etc.

        // Update state
        setState((prev) => ({
          ...prev,
          isApplying: false,
          lastAppliedAction: historyEntry,
          system: {
            ...prev.system,
            recentActions: [...prev.system.recentActions, historyEntry],
            usageStats: {
              ...prev.system.usageStats,
              totalRewards: prev.system.usageStats.totalRewards + 1,
              rewardsToday:
                prev.system.usageStats.rewardsToday +
                (isToday(historyEntry.timestamp) ? 1 : 0),
              lastAction: historyEntry.timestamp,
            },
          },
        }));

        logger.info("Reward applied successfully", {
          rewardId,
          historyId: historyEntry.id,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to apply reward";
        setState((prev) => ({
          ...prev,
          isApplying: false,
          error: errorMessage,
        }));
        logger.error("Failed to apply reward", { error: error as Error });
      }
    },
    [user, relationshipId, canApplyAction, state.system.availableRewards],
  );

  const applyPunishment = useCallback(
    async (
      punishmentId: string,
      reason: string,
      customImpact?: Partial<PunishmentImpact>,
    ): Promise<void> => {
      if (!user?.uid || !canApplyAction(punishmentId, "punishment")) {
        setState((prev) => ({
          ...prev,
          error:
            "Cannot apply punishment: Permission denied or cooldown active",
        }));
        return;
      }

      const punishment = state.system.availablePunishments.find(
        (p) => p.id === punishmentId,
      );
      if (!punishment) {
        setState((prev) => ({ ...prev, error: "Punishment not found" }));
        return;
      }

      if (!reason || reason.trim().length === 0) {
        setState((prev) => ({
          ...prev,
          error: "Reason required for all punishments",
        }));
        return;
      }

      setState((prev) => ({ ...prev, isApplying: true, error: null }));

      try {
        logger.info("Applying punishment", {
          punishmentId,
          reason,
          relationshipId,
        });

        // Create history entry
        const historyEntry: RewardPunishmentHistory = {
          id: generateActionId(),
          keyholderId: user.uid,
          submissiveId: relationshipId,
          type: "punishment",
          actionId: punishmentId,
          actionName: punishment.name,
          reason: reason.trim(),
          impact: { ...punishment.impact, ...customImpact },
          timestamp: new Date(),
          appliedBy: user.displayName || user.uid,
        };

        // TODO: Apply the actual punishment impact (time addition, task assignment, etc.)
        // This would integrate with session management, task system, etc.

        // Update state
        setState((prev) => ({
          ...prev,
          isApplying: false,
          lastAppliedAction: historyEntry,
          system: {
            ...prev.system,
            recentActions: [...prev.system.recentActions, historyEntry],
            usageStats: {
              ...prev.system.usageStats,
              totalPunishments: prev.system.usageStats.totalPunishments + 1,
              punishmentsToday:
                prev.system.usageStats.punishmentsToday +
                (isToday(historyEntry.timestamp) ? 1 : 0),
              lastAction: historyEntry.timestamp,
            },
          },
        }));

        logger.info("Punishment applied successfully", {
          punishmentId,
          historyId: historyEntry.id,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to apply punishment";
        setState((prev) => ({
          ...prev,
          isApplying: false,
          error: errorMessage,
        }));
        logger.error("Failed to apply punishment", { error: error as Error });
      }
    },
    [user, relationshipId, canApplyAction, state.system.availablePunishments],
  );

  // ==================== CONVENIENCE METHODS ====================

  const addSessionTime = useCallback(
    async (minutes: number, reason: string): Promise<void> => {
      const timeChangeSeconds = Math.min(
        minutes * 60,
        state.system.settings.maxTimeChangeMinutes * 60,
      );

      // Find or create a time addition punishment
      let punishmentId = `time_addition_${minutes}`;
      let punishment = state.system.availablePunishments.find(
        (p) => p.id === punishmentId,
      );

      if (!punishment) {
        // Use the closest available punishment
        punishment = state.system.availablePunishments
          .filter((p) => p.type === "time_addition")
          .sort(
            (a, b) =>
              Math.abs((a.impact.timeChangeSeconds || 0) - timeChangeSeconds) -
              Math.abs((b.impact.timeChangeSeconds || 0) - timeChangeSeconds),
          )[0];
      }

      if (!punishment) {
        setState((prev) => ({
          ...prev,
          error: "No time addition punishment available",
        }));
        return;
      }

      await applyPunishment(punishment.id, reason, { timeChangeSeconds });
    },
    [state.system, applyPunishment],
  );

  const reduceSessionTime = useCallback(
    async (minutes: number, reason: string): Promise<void> => {
      const timeChangeSeconds = -Math.min(
        minutes * 60,
        state.system.settings.maxTimeChangeMinutes * 60,
      );

      // Find or create a time reduction reward
      let rewardId = `time_reduction_${minutes}`;
      let reward = state.system.availableRewards.find((r) => r.id === rewardId);

      if (!reward) {
        // Use the closest available reward
        reward = state.system.availableRewards
          .filter((r) => r.type === "time_reduction")
          .sort(
            (a, b) =>
              Math.abs((a.impact.timeChangeSeconds || 0) - timeChangeSeconds) -
              Math.abs((b.impact.timeChangeSeconds || 0) - timeChangeSeconds),
          )[0];
      }

      if (!reward) {
        setState((prev) => ({
          ...prev,
          error: "No time reduction reward available",
        }));
        return;
      }

      await applyReward(reward.id, reason, { timeChangeSeconds });
    },
    [state.system, applyReward],
  );

  const awardAchievement = useCallback(
    async (achievementId: string, reason?: string): Promise<void> => {
      await applyReward("achievement_unlock", reason, { achievementId });
    },
    [applyReward],
  );

  const assignTask = useCallback(
    async (task: TaskAssignment): Promise<void> => {
      // Find a task assignment punishment
      const punishment = state.system.availablePunishments.find(
        (p) => p.type === "task_assignment",
      );

      if (!punishment) {
        setState((prev) => ({
          ...prev,
          error: "Task assignment not available",
        }));
        return;
      }

      await applyPunishment(punishment.id, `Task assigned: ${task.title}`, {
        taskData: task,
      });
    },
    [state.system.availablePunishments, applyPunishment],
  );

  // ==================== HISTORY MANAGEMENT ====================

  const getHistory = useCallback(
    (days: number = 30): RewardPunishmentHistory[] => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      return state.system.recentActions
        .filter((action) => action.timestamp > cutoffDate)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    },
    [state.system.recentActions],
  );

  const clearHistory = useCallback(async (): Promise<void> => {
    setState((prev) => ({
      ...prev,
      system: {
        ...prev.system,
        recentActions: [],
        usageStats: {
          ...prev.system.usageStats,
          totalRewards: 0,
          totalPunishments: 0,
          rewardsToday: 0,
          punishmentsToday: 0,
          lastAction: null,
        },
      },
    }));
    logger.info("Reward/punishment history cleared");
  }, []);

  const resetError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // ==================== EFFECTS ====================

  // Clean up old history entries (keep last 100)
  useEffect(() => {
    if (state.system.recentActions.length > 100) {
      setState((prev) => ({
        ...prev,
        system: {
          ...prev.system,
          recentActions: prev.system.recentActions
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, 100),
        },
      }));
    }
  }, [state.system.recentActions.length]);

  // ==================== RETURN ====================

  const actions: RewardPunishmentActions = {
    applyReward,
    applyPunishment,
    addSessionTime,
    reduceSessionTime,
    awardAchievement,
    assignTask,
    getHistory,
    clearHistory,
    canApplyAction,
    getActionCooldown,
    resetError,
  };

  return {
    // State
    ...state,

    // Computed
    ...computedValues,

    // Actions
    ...actions,
  };
};

export type UseKeyholderRewardsReturn = ReturnType<typeof useKeyholderRewards>;
