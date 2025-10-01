/**
 * Goal Data Loading Hook
 * Handles loading of goal-related data including active goals, templates, and history
 */
import { useState, useCallback } from "react";
import { serviceLogger } from "../../utils/logging";
import { calculateGoalProgress } from "./session-goals-utils";
import { DEFAULT_GOAL_TEMPLATES } from "../../constants/session-goals-templates";
import type {
  SessionGoal,
  GoalTemplate,
  GoalProgress,
  KeyholderAssignedGoal,
  GoalHistoryEntry,
  GoalAchievement,
} from "./types/SessionGoals";

const logger = serviceLogger("useGoalData");

export const useGoalData = (userId: string, relationshipId?: string) => {
  const [activeGoals, setActiveGoals] = useState<SessionGoal[]>([]);
  const [goalTemplates, setGoalTemplates] = useState<GoalTemplate[]>([]);
  const [progress, setProgress] = useState<GoalProgress[]>([]);
  const [keyholderGoals, setKeyholderGoals] = useState<KeyholderAssignedGoal[]>(
    [],
  );
  const [goalHistory, setGoalHistory] = useState<GoalHistoryEntry[]>([]);
  const [achievements, setAchievements] = useState<GoalAchievement[]>([]);

  const loadActiveGoals = useCallback(async () => {
    try {
      setActiveGoals([]);
    } catch (error) {
      logger.error("Failed to load active goals", { error });
    }
  }, []);

  const loadGoalTemplates = useCallback(async () => {
    try {
      setGoalTemplates(DEFAULT_GOAL_TEMPLATES);
    } catch (error) {
      logger.error("Failed to load goal templates", { error });
    }
  }, []);

  const loadProgress = useCallback(async () => {
    try {
      const progressData = activeGoals.map((goal) =>
        calculateGoalProgress(goal),
      );
      setProgress(progressData);
    } catch (error) {
      logger.error("Failed to load goal progress", { error });
    }
  }, [activeGoals]);

  const loadKeyholderGoals = useCallback(async () => {
    try {
      if (!relationshipId) {
        setKeyholderGoals([]);
        return;
      }
      setKeyholderGoals([]);
    } catch (error) {
      logger.error("Failed to load keyholder goals", { error });
    }
  }, [relationshipId]);

  const loadGoalHistory = useCallback(async () => {
    try {
      setGoalHistory([]);
    } catch (error) {
      logger.error("Failed to load goal history", { error });
    }
  }, []);

  const loadAchievements = useCallback(async () => {
    try {
      setAchievements([]);
    } catch (error) {
      logger.error("Failed to load achievements", { error });
    }
  }, []);

  return {
    activeGoals,
    goalTemplates,
    progress,
    keyholderGoals,
    goalHistory,
    achievements,
    setActiveGoals,
    setProgress,
    setKeyholderGoals,
    setGoalHistory,
    setAchievements,
    loadActiveGoals,
    loadGoalTemplates,
    loadProgress,
    loadKeyholderGoals,
    loadGoalHistory,
    loadAchievements,
  };
};
