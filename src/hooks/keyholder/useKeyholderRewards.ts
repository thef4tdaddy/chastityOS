import { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, collection, addDoc, updateDoc, query, where, orderBy, limit, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

// Types and Interfaces
export interface RewardAction {
  id: string;
  type: 'time_reduction' | 'early_release' | 'achievement_unlock' | 'task_completion';
  name: string;
  description: string;
  impact: RewardImpact;
  requiresReason: boolean;
}

export interface PunishmentAction {
  id: string;
  type: 'time_addition' | 'goal_increase' | 'task_assignment' | 'restriction';
  name: string;
  description: string;
  impact: PunishmentImpact;
  requiresReason: boolean;
}

export interface RewardImpact {
  timeChangeMinutes?: number;
  achievementId?: string;
  taskCompletion?: boolean;
  customEffect?: any;
}

export interface PunishmentImpact {
  timeChangeMinutes?: number;
  goalIncrease?: number;
  taskAssignment?: TaskAssignment;
  restrictionType?: string;
  customEffect?: any;
}

export interface TaskAssignment {
  title: string;
  description: string;
  deadline?: Date;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  requiredEvidence?: string[];
}

export interface RewardPunishmentHistory {
  id: string;
  type: 'reward' | 'punishment';
  actionId: string;
  actionName: string;
  relationshipId: string;
  reason?: string;
  impact: RewardImpact | PunishmentImpact;
  appliedBy: string;
  appliedAt: Date;
  result: 'success' | 'failed' | 'pending';
}

export interface RewardPunishmentSettings {
  maxTimeChangePerAction: number; // minutes
  cooldownBetweenActions: number; // minutes
  requireReasonForPunishments: boolean;
  requireReasonForRewards: boolean;
  enabledRewardTypes: string[];
  enabledPunishmentTypes: string[];
}

export interface RewardPunishmentSystem {
  availableRewards: RewardAction[];
  availablePunishments: PunishmentAction[];
  recentActions: RewardPunishmentHistory[];
  settings: RewardPunishmentSettings;
}

export const useKeyholderRewards = (relationshipId: string, keyholderId?: string) => {
  // State
  const [system, setSystem] = useState<RewardPunishmentSystem>({
    availableRewards: [],
    availablePunishments: [],
    recentActions: [],
    settings: {
      maxTimeChangePerAction: 120, // 2 hours
      cooldownBetweenActions: 30, // 30 minutes
      requireReasonForPunishments: true,
      requireReasonForRewards: false,
      enabledRewardTypes: ['time_reduction', 'achievement_unlock', 'task_completion'],
      enabledPunishmentTypes: ['time_addition', 'task_assignment'],
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize available actions
  useEffect(() => {
    const availableRewards: RewardAction[] = [
      {
        id: 'time_reduction_30',
        type: 'time_reduction',
        name: 'Time Reduction (30 min)',
        description: 'Reduce session time by 30 minutes',
        impact: { timeChangeMinutes: -30 },
        requiresReason: false,
      },
      {
        id: 'time_reduction_60',
        type: 'time_reduction',
        name: 'Time Reduction (1 hour)',
        description: 'Reduce session time by 1 hour',
        impact: { timeChangeMinutes: -60 },
        requiresReason: false,
      },
      {
        id: 'early_release',
        type: 'early_release',
        name: 'Early Release',
        description: 'End current session early',
        impact: { customEffect: 'early_release' },
        requiresReason: true,
      },
      {
        id: 'good_behavior_achievement',
        type: 'achievement_unlock',
        name: 'Good Behavior Badge',
        description: 'Award good behavior achievement',
        impact: { achievementId: 'good_behavior' },
        requiresReason: false,
      },
    ];

    const availablePunishments: PunishmentAction[] = [
      {
        id: 'time_addition_30',
        type: 'time_addition',
        name: 'Time Addition (30 min)',
        description: 'Add 30 minutes to session time',
        impact: { timeChangeMinutes: 30 },
        requiresReason: true,
      },
      {
        id: 'time_addition_60',
        type: 'time_addition',
        name: 'Time Addition (1 hour)',
        description: 'Add 1 hour to session time',
        impact: { timeChangeMinutes: 60 },
        requiresReason: true,
      },
      {
        id: 'extra_task',
        type: 'task_assignment',
        name: 'Extra Task',
        description: 'Assign an additional task',
        impact: {
          taskAssignment: {
            title: 'Extra Task',
            description: 'Complete assigned task as consequence',
            category: 'discipline',
            difficulty: 'medium',
          },
        },
        requiresReason: true,
      },
      {
        id: 'goal_increase',
        type: 'goal_increase',
        name: 'Goal Increase',
        description: 'Increase session goals',
        impact: { goalIncrease: 1 },
        requiresReason: true,
      },
    ];

    setSystem(prev => ({
      ...prev,
      availableRewards,
      availablePunishments,
    }));
  }, []);

  // Load recent actions
  useEffect(() => {
    if (!relationshipId) {
      setIsLoading(false);
      return;
    }

    const actionsQuery = query(
      collection(db, 'rewardPunishmentHistory'),
      where('relationshipId', '==', relationshipId),
      orderBy('appliedAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(actionsQuery, (snapshot) => {
      const actions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        appliedAt: doc.data().appliedAt?.toDate(),
      })) as RewardPunishmentHistory[];

      setSystem(prev => ({
        ...prev,
        recentActions: actions,
      }));
      setIsLoading(false);
    }, (err) => {
      console.error('Error loading reward/punishment history:', err);
      setError('Failed to load history');
      setIsLoading(false);
    });

    return unsubscribe;
  }, [relationshipId]);

  // Actions
  const applyReward = useCallback(async (rewardId: string, reason?: string): Promise<void> => {
    const reward = system.availableRewards.find(r => r.id === rewardId);
    if (!reward) {
      throw new Error('Reward not found');
    }

    if (reward.requiresReason && !reason) {
      throw new Error('Reason is required for this reward');
    }

    try {
      // Check cooldown
      const lastAction = system.recentActions[0];
      if (lastAction) {
        const timeSinceLastAction = Date.now() - lastAction.appliedAt.getTime();
        const cooldownMs = system.settings.cooldownBetweenActions * 60000;
        if (timeSinceLastAction < cooldownMs) {
          throw new Error(`Must wait ${system.settings.cooldownBetweenActions} minutes between actions`);
        }
      }

      // Apply the reward effect
      if (reward.impact.timeChangeMinutes) {
        await addSessionTime(reward.impact.timeChangeMinutes, reason || reward.name);
      }

      if (reward.impact.achievementId) {
        await awardAchievement(reward.impact.achievementId, reason);
      }

      // Log the action
      await addDoc(collection(db, 'rewardPunishmentHistory'), {
        type: 'reward',
        actionId: rewardId,
        actionName: reward.name,
        relationshipId,
        reason,
        impact: reward.impact,
        appliedBy: keyholderId,
        appliedAt: serverTimestamp(),
        result: 'success',
      });

    } catch (err) {
      console.error('Error applying reward:', err);
      throw err;
    }
  }, [system, relationshipId, keyholderId]);

  const applyPunishment = useCallback(async (punishmentId: string, reason: string): Promise<void> => {
    const punishment = system.availablePunishments.find(p => p.id === punishmentId);
    if (!punishment) {
      throw new Error('Punishment not found');
    }

    if (!reason) {
      throw new Error('Reason is required for punishments');
    }

    try {
      // Apply the punishment effect
      if (punishment.impact.timeChangeMinutes) {
        await addSessionTime(punishment.impact.timeChangeMinutes, reason);
      }

      if (punishment.impact.taskAssignment) {
        await assignTask(punishment.impact.taskAssignment);
      }

      // Log the action
      await addDoc(collection(db, 'rewardPunishmentHistory'), {
        type: 'punishment',
        actionId: punishmentId,
        actionName: punishment.name,
        relationshipId,
        reason,
        impact: punishment.impact,
        appliedBy: keyholderId,
        appliedAt: serverTimestamp(),
        result: 'success',
      });

    } catch (err) {
      console.error('Error applying punishment:', err);
      throw err;
    }
  }, [system, relationshipId, keyholderId]);

  const addSessionTime = useCallback(async (minutes: number, reason: string): Promise<void> => {
    try {
      // Validate time change limit
      const absMinutes = Math.abs(minutes);
      if (absMinutes > system.settings.maxTimeChangePerAction) {
        throw new Error(`Time change cannot exceed ${system.settings.maxTimeChangePerAction} minutes`);
      }

      // Update the session time in the user's data
      // This would integrate with the existing session management
      const userDocRef = doc(db, 'users', relationshipId); // Assuming relationshipId maps to user
      await updateDoc(userDocRef, {
        requiredKeyholderDurationSeconds: Math.max(0, minutes * 60), // Convert to seconds
        lastModifiedBy: keyholderId,
        lastModifiedAt: serverTimestamp(),
        modificationReason: reason,
      });

    } catch (err) {
      console.error('Error modifying session time:', err);
      throw err;
    }
  }, [system.settings.maxTimeChangePerAction, relationshipId, keyholderId]);

  const reduceSessionTime = useCallback(async (minutes: number, reason: string): Promise<void> => {
    await addSessionTime(-minutes, reason);
  }, [addSessionTime]);

  const awardAchievement = useCallback(async (achievementId: string, reason?: string): Promise<void> => {
    try {
      await addDoc(collection(db, 'achievements'), {
        achievementId,
        relationshipId,
        awardedBy: keyholderId,
        awardedAt: serverTimestamp(),
        reason: reason || '',
      });
    } catch (err) {
      console.error('Error awarding achievement:', err);
      throw err;
    }
  }, [relationshipId, keyholderId]);

  const assignTask = useCallback(async (task: TaskAssignment): Promise<void> => {
    try {
      await addDoc(collection(db, 'tasks'), {
        ...task,
        relationshipId,
        assignedBy: keyholderId,
        assignedAt: serverTimestamp(),
        status: 'pending',
        deadline: task.deadline || null,
      });
    } catch (err) {
      console.error('Error assigning task:', err);
      throw err;
    }
  }, [relationshipId, keyholderId]);

  const getHistory = useCallback((days = 7): RewardPunishmentHistory[] => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return system.recentActions.filter(action => 
      action.appliedAt >= cutoffDate
    );
  }, [system.recentActions]);

  // Computed values
  const canApplyRewards = true; // Would check permissions
  const canApplyPunishments = true; // Would check permissions

  const getRecentCount = useCallback((type: 'reward' | 'punishment', hours: number): number => {
    const cutoffTime = new Date().getTime() - (hours * 60 * 60 * 1000);
    return system.recentActions.filter(action => 
      action.type === type && action.appliedAt.getTime() > cutoffTime
    ).length;
  }, [system.recentActions]);

  const recentRewardCount = getRecentCount('reward', 24);
  const recentPunishmentCount = getRecentCount('punishment', 24);

  // Check if in cooldown
  const isInCooldown = useMemo(() => {
    const lastAction = system.recentActions[0];
    if (!lastAction) return false;
    
    const timeSinceLastAction = Date.now() - lastAction.appliedAt.getTime();
    const cooldownMs = system.settings.cooldownBetweenActions * 60000;
    return timeSinceLastAction < cooldownMs;
  }, [system.recentActions, system.settings.cooldownBetweenActions]);

  const cooldownTimeRemaining = useMemo(() => {
    if (!isInCooldown) return 0;
    
    const lastAction = system.recentActions[0];
    const timeSinceLastAction = Date.now() - lastAction.appliedAt.getTime();
    const cooldownMs = system.settings.cooldownBetweenActions * 60000;
    return Math.max(0, cooldownMs - timeSinceLastAction);
  }, [isInCooldown, system.recentActions, system.settings.cooldownBetweenActions]);

  return {
    // State
    system,
    isLoading,
    error,

    // Actions
    applyReward,
    applyPunishment,
    addSessionTime,
    reduceSessionTime,
    awardAchievement,
    assignTask,
    getHistory,

    // Computed
    canApplyRewards,
    canApplyPunishments,
    recentRewardCount,
    recentPunishmentCount,
    isInCooldown,
    cooldownTimeRemaining,
    
    // Quick access
    availableRewards: system.availableRewards,
    availablePunishments: system.availablePunishments,
    recentActions: system.recentActions,
  };
};