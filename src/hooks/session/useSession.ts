/**
 * Enhanced Session Management Hook
 * Provides comprehensive session management with keyholder integration,
 * goal tracking, and advanced analytics
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import type { DBSession, DBGoal } from "../../types/database";
import type { KeyholderRelationship } from "../../types/core";
import { KeyholderRelationshipService } from "../../services/KeyholderRelationshipService";
import { sessionDBService } from "../../services/database/SessionDBService";
import { serviceLogger } from "../../utils/logging";

const logger = serviceLogger("useSession");

// ==================== INTERFACES ====================

export interface SessionGoals {
  personal: DBGoal[];
  keyholderAssigned: DBGoal[];
  active: DBGoal[];
}

export interface SessionContext {
  userId: string;
  relationshipId?: string;
  sessionType: "self_managed" | "keyholder_managed" | "collaborative";
  permissions: SessionPermission[];
}

export interface KeyholderInfo {
  id: string;
  name: string;
  lastSeen: Date;
}

export interface KeyholderSessionControls {
  canModify: boolean;
  canOverride: boolean;
  activeKeyholder: KeyholderInfo;
  controlHistory: ControlAction[];
}

export interface SessionAnalytics {
  averageSessionLength: number;
  completionRate: number;
  goalAchievementRate: number;
  totalSessions: number;
  consistencyScore: number;
}

export interface SessionInsights {
  predictedDuration: number;
  optimalGoalDuration: number;
  completionProbability: number;
  riskFactors: string[];
  recommendations: string[];
}

export interface PredictiveAnalytics {
  nextSessionPrediction: {
    suggestedDuration: number;
    successProbability: number;
    recommendedGoals: string[];
  };
  weeklyTrend: {
    direction: "improving" | "declining" | "stable";
    confidence: number;
  };
}

export interface SessionHistoryEntry {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  goals: DBGoal[];
  completedGoals: string[];
  notes?: string;
  rating?: number;
}

export interface EnhancedSessionState {
  currentSession: DBSession | null;
  sessionContext: SessionContext;
  keyholderControls: KeyholderSessionControls | null;
  goals: SessionGoals;
  history: SessionHistoryEntry[];
  analytics: SessionAnalytics;
}

export type SessionPermission =
  | "start_session"
  | "end_session"
  | "modify_goals"
  | "pause_session"
  | "self_modify"
  | "override_restrictions";

export interface ControlAction {
  id: string;
  action: string;
  timestamp: Date;
  reason?: string;
  performedBy: "keyholder" | "submissive" | "system";
}

export interface SessionModifications {
  goalDuration?: number;
  goals?: Partial<DBGoal>[];
  notes?: string;
  endReason?: string;
}

export interface ModificationRequest {
  id: string;
  type: "goal_change" | "early_end" | "time_extension";
  requestedBy: string;
  reason: string;
  details: Record<string, unknown>;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
}

export interface ApprovalStatus {
  approved: boolean;
  reason?: string;
  approvedBy?: string;
  approvedAt?: Date;
}

// ==================== HOOK IMPLEMENTATION ====================

// Complex session management hook with analytics, goals, and keyholder controls
// eslint-disable-next-line max-statements
export const useSession = (userId: string, relationshipId?: string) => {
  // ==================== STATE ====================

  const [currentSession, setCurrentSession] = useState<DBSession | null>(null);
  const [goals, setGoals] = useState<SessionGoals>({
    personal: [],
    keyholderAssigned: [],
    active: [],
  });
  const [_history, setHistory] = useState<SessionHistoryEntry[]>([]);
  const [keyholderControls, setKeyholderControls] =
    useState<KeyholderSessionControls | null>(null);
  const [analytics, setAnalytics] = useState<SessionAnalytics>({
    averageSessionLength: 0,
    completionRate: 0,
    goalAchievementRate: 0,
    totalSessions: 0,
    consistencyScore: 0,
  });
  const [relationship, setRelationship] =
    useState<KeyholderRelationship | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second for live duration calculation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ==================== COMPUTED VALUES ====================

  const sessionContext = useMemo((): SessionContext => {
    if (!userId) {
      return {
        userId: "",
        sessionType: "self_managed",
        permissions: [],
      };
    }

    return {
      userId,
      relationshipId,
      sessionType: relationshipId
        ? keyholderControls?.canModify
          ? "keyholder_managed"
          : "collaborative"
        : "self_managed",
      permissions: derivePermissions(relationship, keyholderControls),
    };
  }, [userId, relationshipId, keyholderControls, relationship]);

  const isActive = useMemo(
    () => currentSession?.endTime == null && currentSession != null,
    [currentSession],
  );

  const duration = useMemo(
    () => (currentSession ? calculateDuration(currentSession, currentTime) : 0),
    [currentSession, currentTime],
  );

  const goalProgress = useMemo(
    () => calculateGoalProgress(currentSession, goals),
    [currentSession, goals],
  );

  const isUnderKeyholderControl = useMemo(
    () => !!relationshipId && !!keyholderControls,
    [relationshipId, keyholderControls],
  );

  const canSelfModify = useMemo(
    () =>
      !keyholderControls?.canModify ||
      sessionContext.permissions.includes("self_modify"),
    [keyholderControls, sessionContext.permissions],
  );

  // ==================== INITIALIZATION ====================

  useEffect(() => {
    const initializeSession = async () => {
      if (!userId) return;

      try {
        setIsLoading(true);
        setError(null);

        // Load relationship if provided
        if (relationshipId) {
          const relationships =
            await KeyholderRelationshipService.getUserRelationships(userId);
          const activeRelationship =
            relationships.asSubmissive.find(
              (rel) => rel.id === relationshipId && rel.status === "active",
            ) ||
            relationships.asKeyholder.find(
              (rel) => rel.id === relationshipId && rel.status === "active",
            );

          setRelationship(activeRelationship || null);

          if (activeRelationship) {
            setKeyholderControls({
              canModify:
                activeRelationship.permissions.canLockSessions || false,
              canOverride:
                activeRelationship.permissions.canUnlockSessions || false,
              activeKeyholder: {
                id: activeRelationship.keyholderUserId,
                name: "Keyholder", // Would get from user profile
                lastSeen: new Date(),
              },
              controlHistory: [],
            });
          }
        }

        // Load current session, goals, history, and analytics
        await Promise.all([
          loadCurrentSession(),
          loadGoals(),
          loadHistory(),
          loadAnalytics(),
        ]);
      } catch (err) {
        logger.error("Failed to initialize session", { error: err });
        setError(
          err instanceof Error ? err.message : "Failed to initialize session",
        );
      } finally {
        setIsLoading(false);
      }
    };

    initializeSession();
    // Callback functions are stable (wrapped in useCallback below)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, relationshipId]);

  // ==================== DATA LOADING FUNCTIONS ====================

  const loadCurrentSession = useCallback(async () => {
    if (!userId) return;

    try {
      const session = await sessionDBService.getCurrentSession(userId);
      setCurrentSession(session || null);
      logger.info("Loaded current session", {
        userId,
        sessionId: session?.id,
        hasSession: !!session,
      });
    } catch (error) {
      logger.error("Failed to load current session", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId,
      });
      setCurrentSession(null);
    }
  }, [userId]);

  const loadGoals = useCallback(async () => {
    // This would integrate with your existing goals service
    setGoals({
      personal: [],
      keyholderAssigned: [],
      active: [],
    });
  }, []); // userId and relationshipId are passed but not used in mock

  const loadHistory = useCallback(async () => {
    // This would integrate with your existing history service
    setHistory([]);
  }, []); // userId is passed but not used in mock

  const loadAnalytics = useCallback(async () => {
    // This would integrate with your existing analytics service
    setAnalytics({
      averageSessionLength: 0,
      completionRate: 0,
      goalAchievementRate: 0,
      totalSessions: 0,
      consistencyScore: 0,
    });
  }, []); // userId is passed but not used in mock

  // ==================== SESSION LIFECYCLE ====================

  const startSession = useCallback(
    async (sessionGoals?: SessionGoals): Promise<DBSession> => {
      if (!userId) throw new Error("User ID required to start session");

      try {
        logger.debug("Starting new session", {
          userId,
          hasGoals: !!sessionGoals,
        });

        // Check permissions
        if (
          sessionContext.sessionType === "keyholder_managed" &&
          !sessionContext.permissions.includes("start_session")
        ) {
          throw new Error("Keyholder approval required to start session");
        }

        // Save session to database
        const sessionId = await sessionDBService.startSession(userId, {
          isHardcoreMode: false,
          keyholderApprovalRequired:
            sessionContext.sessionType === "keyholder_managed",
        });

        // Load the newly created session
        const newSession = await sessionDBService.getCurrentSession(userId);
        if (!newSession) {
          throw new Error("Failed to load newly created session");
        }

        // Add goals if provided
        if (sessionGoals) {
          await setGoals(sessionGoals);
        }

        setCurrentSession(newSession);
        logger.info("Session started successfully", {
          sessionId: newSession.id,
        });

        return newSession;
      } catch (error) {
        logger.error("Failed to start session", { error });
        throw error;
      }
    },
    [userId, sessionContext],
  );

  const stopSession = useCallback(
    async (reason?: string): Promise<void> => {
      if (!currentSession) throw new Error("No active session to stop");

      try {
        logger.debug("Stopping session", {
          sessionId: currentSession.id,
          reason,
        });

        // Check permissions
        if (
          sessionContext.sessionType === "keyholder_managed" &&
          !sessionContext.permissions.includes("end_session")
        ) {
          throw new Error("Keyholder approval required to end session");
        }

        const endTime = new Date();

        // End session in database
        await sessionDBService.endSession(currentSession.id, endTime, reason);

        // Update local session with endTime (don't set to null - we need it for off-time tracking)
        setCurrentSession({
          ...currentSession,
          endTime,
          isPaused: false,
        });

        await loadHistory(); // Refresh history
        await loadAnalytics(); // Refresh analytics

        logger.info("Session stopped successfully", {
          sessionId: currentSession.id,
        });
      } catch (error) {
        logger.error("Failed to stop session", { error });
        throw error;
      }
    },
    [currentSession, sessionContext, loadHistory, loadAnalytics],
  );

  // ==================== ENHANCED CONTROLS ====================

  const modifySession = useCallback(
    async (modifications: SessionModifications): Promise<void> => {
      if (!currentSession) throw new Error("No active session to modify");

      if (!canSelfModify) {
        throw new Error("Session modification requires keyholder approval");
      }

      try {
        logger.debug("Modifying session", {
          sessionId: currentSession.id,
          modifications,
        });

        // Update session in database
        await sessionDBService.update(currentSession.id, {
          ...modifications,
          lastModified: new Date(),
        });

        // Reload the session
        const updatedSession = await sessionDBService.get(currentSession.id);
        setCurrentSession(updatedSession || null);

        logger.info("Session modified successfully", {
          sessionId: currentSession.id,
        });
      } catch (error) {
        logger.error("Failed to modify session", { error });
        throw error;
      }
    },
    [currentSession, canSelfModify],
  );

  const setSessionGoals = useCallback(
    async (sessionGoals: SessionGoals): Promise<void> => {
      if (!sessionContext.permissions.includes("modify_goals")) {
        throw new Error("Goal modification requires appropriate permissions");
      }

      try {
        logger.debug("Setting session goals", {
          userId,
          goalCount: sessionGoals.active.length,
        });
        setGoals(sessionGoals);
        logger.info("Session goals updated successfully");
      } catch (error) {
        logger.error("Failed to set session goals", { error });
        throw error;
      }
    },
    [sessionContext.permissions, userId],
  );

  const requestModification = useCallback(
    async (request: ModificationRequest): Promise<void> => {
      if (!relationshipId)
        throw new Error("Modification requests require active relationship");

      try {
        logger.debug("Creating modification request", {
          requestId: request.id,
          type: request.type,
        });
        // This would integrate with your notification/request system
        logger.info("Modification request created successfully", {
          requestId: request.id,
        });
      } catch (error) {
        logger.error("Failed to create modification request", { error });
        throw error;
      }
    },
    [relationshipId],
  );

  // ==================== KEYHOLDER INTEGRATION ====================

  const requestKeyholderApproval = useCallback(
    async (action: string): Promise<ApprovalStatus> => {
      if (!keyholderControls) {
        return { approved: true }; // Auto-approve if no keyholder control
      }

      try {
        logger.debug("Requesting keyholder approval", {
          action,
          keyholderId: keyholderControls.activeKeyholder.id,
        });

        // This would integrate with your keyholder notification system
        // For now, return pending status
        return {
          approved: false,
          reason: "Approval request sent to keyholder",
        };
      } catch (error) {
        logger.error("Failed to request keyholder approval", { error });
        throw error;
      }
    },
    [keyholderControls],
  );

  // ==================== ANALYTICS AND INSIGHTS ====================

  const getSessionInsights = useCallback((): SessionInsights => {
    return {
      predictedDuration: analytics.averageSessionLength,
      optimalGoalDuration: analytics.averageSessionLength * 1.2,
      completionProbability: analytics.completionRate,
      riskFactors: [],
      recommendations: [],
    };
  }, [analytics]);

  const getPredictiveAnalytics = useCallback((): PredictiveAnalytics => {
    return {
      nextSessionPrediction: {
        suggestedDuration: analytics.averageSessionLength,
        successProbability: analytics.completionRate,
        recommendedGoals: ["Duration Goal", "Consistency Goal"],
      },
      weeklyTrend: {
        direction: "stable",
        confidence: 0.8,
      },
    };
  }, [analytics]);

  // ==================== SESSION POLLING ====================

  // Poll for session updates every 5 seconds (only if session is active)
  useEffect(() => {
    if (!userId) return;

    // Don't poll if session has ended - we want to keep the ended session for off-time tracking
    if (currentSession?.endTime) return;

    const intervalId = setInterval(() => {
      loadCurrentSession();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [userId, currentSession?.endTime, loadCurrentSession]);

  // ==================== RETURN HOOK INTERFACE ====================

  return {
    // Enhanced state
    session: currentSession,
    context: sessionContext,
    keyholderControls,
    goals,
    analytics,

    // Session lifecycle
    startSession,
    stopSession,

    // Enhanced controls
    modifySession,
    setGoals: setSessionGoals,
    requestModification,

    // Keyholder integration
    requestKeyholderApproval,

    // Analytics and insights
    getSessionInsights,
    getPredictiveAnalytics,

    // Computed values
    isActive,
    duration,
    goalProgress,
    isUnderKeyholderControl,
    canSelfModify,

    // Loading states
    isLoading,
    error,

    // Utility
    refreshSession: loadCurrentSession,
  };
};

// ==================== HELPER FUNCTIONS ====================

function derivePermissions(
  relationship: KeyholderRelationship | null,
  controls: KeyholderSessionControls | null,
): SessionPermission[] {
  const permissions: SessionPermission[] = [];

  if (!relationship || !controls) {
    // Self-managed session - all permissions
    return [
      "start_session",
      "end_session",
      "modify_goals",
      "pause_session",
      "self_modify",
    ];
  }

  // Keyholder-managed permissions
  if (relationship.permissions.canLockSessions)
    permissions.push("start_session");
  if (relationship.permissions.canUnlockSessions)
    permissions.push("end_session");
  if (relationship.permissions.canEditGoals) permissions.push("modify_goals");
  if (relationship.permissions.canLockSessions)
    permissions.push("pause_session");
  // Add basic self-modify permission for submissives
  permissions.push("self_modify");
  if (controls.canOverride) permissions.push("override_restrictions");

  return permissions;
}

function calculateDuration(session: DBSession, currentTime: Date): number {
  if (!session.startTime) return 0;

  // Calculate effective time (excluding pauses)
  const endTime = session.endTime || currentTime;
  const totalElapsedMs = endTime.getTime() - session.startTime.getTime();
  const totalElapsedSeconds = Math.floor(totalElapsedMs / 1000);

  // Subtract accumulated pause time
  let effectiveSeconds =
    totalElapsedSeconds - (session.accumulatedPauseTime || 0);

  // If currently paused, also subtract current pause duration
  if (session.isPaused && session.pauseStartTime && !session.endTime) {
    const currentPauseMs =
      currentTime.getTime() - session.pauseStartTime.getTime();
    const currentPauseSeconds = Math.floor(currentPauseMs / 1000);
    effectiveSeconds -= currentPauseSeconds;
  }

  return Math.max(0, effectiveSeconds);
}

function calculateGoalProgress(
  session: DBSession | null,
  goals: SessionGoals | null | undefined,
): number {
  if (!session || !goals || !goals.active || goals.active.length === 0)
    return 0;

  const completedGoals = goals.active.filter((goal) => goal.isCompleted).length;
  return Math.floor((completedGoals / goals.active.length) * 100);
}
