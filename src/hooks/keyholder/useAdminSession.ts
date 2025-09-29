/**
 * useAdminSession Hook
 * Admin session management with time limits, permission boundaries, and audit logging
 * Provides secure admin sessions for keyholders with automatic timeout and activity tracking
 */
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuthState } from "../../contexts";
import { serviceLogger } from "../../utils/logging";

const logger = serviceLogger("useAdminSession");

// ==================== TYPES ====================

export type AdminPermission =
  | "session_control"
  | "task_management"
  | "rewards_punishments"
  | "view_history"
  | "edit_goals"
  | "emergency_unlock"
  | "bulk_operations";

export interface AdminAction {
  id: string;
  sessionId: string;
  action: string;
  permission: AdminPermission;
  targetUserId?: string;
  targetData?: Record<string, any>;
  timestamp: Date;
  details?: string;
}

export interface AdminSession {
  id: string;
  keyholderId: string;
  relationshipId: string;
  startTime: Date;
  expiresAt: Date;
  permissions: AdminPermission[];
  isActive: boolean;
  lastActivity: Date;
  activityCount: number;
  extendedCount: number;
  maxExtensions: number;
}

export interface AdminSessionConfig {
  defaultDurationMinutes: number;
  maxDurationMinutes: number;
  maxExtensions: number;
  extensionDurationMinutes: number;
  warningThresholdMinutes: number;
  autoExtendThresholdMinutes: number;
  activityTrackingInterval: number;
}

export interface AdminSessionState {
  session: AdminSession | null;
  isStarting: boolean;
  isEnding: boolean;
  isExtending: boolean;
  error: string | null;
  config: AdminSessionConfig;
  auditLog: AdminAction[];
}

export interface AdminSessionActions {
  startSession: (
    relationshipId: string,
    duration?: number,
    permissions?: AdminPermission[],
  ) => Promise<AdminSession | null>;
  endSession: () => Promise<void>;
  extendSession: (additionalMinutes?: number) => Promise<void>;
  validatePermission: (permission: AdminPermission) => boolean;
  logAction: (
    action: Omit<AdminAction, "id" | "sessionId" | "timestamp">,
  ) => Promise<void>;
  refreshSession: () => void;
  resetError: () => void;
}

// ==================== CONSTANTS ====================

const DEFAULT_CONFIG: AdminSessionConfig = {
  defaultDurationMinutes: 30,
  maxDurationMinutes: 120,
  maxExtensions: 3,
  extensionDurationMinutes: 15,
  warningThresholdMinutes: 5,
  autoExtendThresholdMinutes: 2,
  activityTrackingInterval: 60000, // 1 minute
};

const DEFAULT_PERMISSIONS: AdminPermission[] = [
  "session_control",
  "task_management",
  "rewards_punishments",
  "view_history",
];

// ==================== INITIAL STATE ====================

const initialState: AdminSessionState = {
  session: null,
  isStarting: false,
  isEnding: false,
  isExtending: false,
  error: null,
  config: DEFAULT_CONFIG,
  auditLog: [],
};

// ==================== UTILITIES ====================

const generateSessionId = (): string => {
  return `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const generateActionId = (): string => {
  return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const calculateTimeRemaining = (session: AdminSession | null): number => {
  if (!session || !session.isActive) return 0;
  const now = new Date();
  const remaining = session.expiresAt.getTime() - now.getTime();
  return Math.max(0, Math.floor(remaining / 1000)); // Return seconds
};

// ==================== MAIN HOOK ====================

export const useAdminSession = (relationshipId: string) => {
  const { user } = useAuthState();
  const [state, setState] = useState<AdminSessionState>(initialState);

  const activityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningShownRef = useRef<boolean>(false);

  // ==================== COMPUTED VALUES ====================

  const computedValues = useMemo(() => {
    const { session, config } = state;
    const timeRemaining = calculateTimeRemaining(session);

    return {
      isActive: session?.isActive ?? false,
      timeRemaining,
      timeRemainingMinutes: Math.ceil(timeRemaining / 60),
      permissions: session?.permissions ?? [],

      // Extension capabilities
      canExtend:
        session &&
        timeRemaining > 0 &&
        timeRemaining < config.warningThresholdMinutes * 60 &&
        session.extendedCount < session.maxExtensions,

      // Warning states
      needsReauth: session && timeRemaining > 0 && timeRemaining < 60, // Last minute
      showWarning:
        session &&
        timeRemaining > 0 &&
        timeRemaining < config.warningThresholdMinutes * 60,
      shouldAutoExtend:
        session &&
        timeRemaining > 0 &&
        timeRemaining < config.autoExtendThresholdMinutes * 60 &&
        session.activityCount > 0 &&
        session.extendedCount < session.maxExtensions,
    };
  }, [state]);

  // ==================== SESSION MANAGEMENT ====================

  const startSession = useCallback(
    async (
      targetRelationshipId: string,
      duration?: number,
      permissions: AdminPermission[] = DEFAULT_PERMISSIONS,
    ): Promise<AdminSession | null> => {
      if (!user?.uid) {
        logger.warn("Cannot start admin session: No authenticated user");
        return null;
      }

      if (state.session?.isActive) {
        logger.warn(
          "Cannot start admin session: Another session is already active",
        );
        setState((prev) => ({
          ...prev,
          error: "Another admin session is already active",
        }));
        return null;
      }

      setState((prev) => ({ ...prev, isStarting: true, error: null }));

      try {
        logger.info("Starting admin session", {
          keyholderId: user.uid,
          relationshipId: targetRelationshipId,
          permissions,
        });

        const durationMinutes = Math.min(
          duration || state.config.defaultDurationMinutes,
          state.config.maxDurationMinutes,
        );

        const now = new Date();
        const newSession: AdminSession = {
          id: generateSessionId(),
          keyholderId: user.uid,
          relationshipId: targetRelationshipId,
          startTime: now,
          expiresAt: new Date(now.getTime() + durationMinutes * 60 * 1000),
          permissions,
          isActive: true,
          lastActivity: now,
          activityCount: 0,
          extendedCount: 0,
          maxExtensions: state.config.maxExtensions,
        };

        // Log session start
        const startAction: AdminAction = {
          id: generateActionId(),
          sessionId: newSession.id,
          action: "SESSION_START",
          permission: "session_control",
          timestamp: now,
          details: `Started admin session with ${permissions.length} permissions for ${durationMinutes} minutes`,
        };

        setState((prev) => ({
          ...prev,
          session: newSession,
          isStarting: false,
          auditLog: [...prev.auditLog, startAction],
        }));

        logger.info("Admin session started successfully", {
          sessionId: newSession.id,
          expiresAt: newSession.expiresAt,
        });

        return newSession;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to start admin session";
        setState((prev) => ({
          ...prev,
          isStarting: false,
          error: errorMessage,
        }));
        logger.error("Failed to start admin session", {
          error: error as Error,
        });
        return null;
      }
    },
    [user?.uid, state.session, state.config],
  );

  const endSession = useCallback(async (): Promise<void> => {
    if (!state.session) {
      logger.warn("Cannot end admin session: No active session");
      return;
    }

    setState((prev) => ({ ...prev, isEnding: true, error: null }));

    try {
      logger.info("Ending admin session", { sessionId: state.session.id });

      // Log session end
      const endAction: AdminAction = {
        id: generateActionId(),
        sessionId: state.session.id,
        action: "SESSION_END",
        permission: "session_control",
        timestamp: new Date(),
        details: `Ended admin session after ${state.session.activityCount} activities`,
      };

      setState((prev) => ({
        ...prev,
        session: null,
        isEnding: false,
        auditLog: [...prev.auditLog, endAction],
      }));

      // Clear activity timer
      if (activityTimerRef.current) {
        clearInterval(activityTimerRef.current);
        activityTimerRef.current = null;
      }

      // Reset warning flag
      warningShownRef.current = false;

      logger.info("Admin session ended successfully");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to end admin session";
      setState((prev) => ({
        ...prev,
        isEnding: false,
        error: errorMessage,
      }));
      logger.error("Failed to end admin session", { error: error as Error });
    }
  }, [state.session]);

  const extendSession = useCallback(
    async (additionalMinutes?: number): Promise<void> => {
      if (!state.session || !state.session.isActive) {
        logger.warn("Cannot extend session: No active session");
        return;
      }

      if (state.session.extendedCount >= state.session.maxExtensions) {
        setState((prev) => ({ ...prev, error: "Maximum extensions reached" }));
        return;
      }

      setState((prev) => ({ ...prev, isExtending: true, error: null }));

      try {
        const extensionMinutes =
          additionalMinutes || state.config.extensionDurationMinutes;
        const newExpiresAt = new Date(
          state.session.expiresAt.getTime() + extensionMinutes * 60 * 1000,
        );

        logger.info("Extending admin session", {
          sessionId: state.session.id,
          extensionMinutes,
          newExpiresAt,
        });

        // Log session extension
        const extendAction: AdminAction = {
          id: generateActionId(),
          sessionId: state.session.id,
          action: "SESSION_EXTEND",
          permission: "session_control",
          timestamp: new Date(),
          details: `Extended session by ${extensionMinutes} minutes`,
        };

        setState((prev) => ({
          ...prev,
          session: prev.session
            ? {
                ...prev.session,
                expiresAt: newExpiresAt,
                extendedCount: prev.session.extendedCount + 1,
                lastActivity: new Date(),
              }
            : null,
          isExtending: false,
          auditLog: [...prev.auditLog, extendAction],
        }));

        // Reset warning flag
        warningShownRef.current = false;

        logger.info("Admin session extended successfully");
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to extend admin session";
        setState((prev) => ({
          ...prev,
          isExtending: false,
          error: errorMessage,
        }));
        logger.error("Failed to extend admin session", {
          error: error as Error,
        });
      }
    },
    [state.session, state.config],
  );

  // ==================== PERMISSION MANAGEMENT ====================

  const validatePermission = useCallback(
    (permission: AdminPermission): boolean => {
      if (!state.session || !state.session.isActive) {
        return false;
      }

      const hasPermission = state.session.permissions.includes(permission);

      if (!hasPermission) {
        logger.warn("Permission denied", {
          permission,
          sessionId: state.session.id,
        });
      }

      return hasPermission;
    },
    [state.session],
  );

  const hasPermission = useCallback(
    (permission: AdminPermission): boolean => {
      return validatePermission(permission);
    },
    [validatePermission],
  );

  // ==================== AUDIT LOGGING ====================

  const logAction = useCallback(
    async (
      actionData: Omit<AdminAction, "id" | "sessionId" | "timestamp">,
    ): Promise<void> => {
      if (!state.session) {
        logger.warn("Cannot log action: No active session");
        return;
      }

      try {
        const action: AdminAction = {
          ...actionData,
          id: generateActionId(),
          sessionId: state.session.id,
          timestamp: new Date(),
        };

        setState((prev) => ({
          ...prev,
          auditLog: [...prev.auditLog, action],
          session: prev.session
            ? {
                ...prev.session,
                lastActivity: new Date(),
                activityCount: prev.session.activityCount + 1,
              }
            : null,
        }));

        logger.debug("Action logged", {
          action: action.action,
          permission: action.permission,
          sessionId: action.sessionId,
        });
      } catch (error) {
        logger.error("Failed to log action", { error: error as Error });
      }
    },
    [state.session],
  );

  // ==================== UTILITY FUNCTIONS ====================

  const refreshSession = useCallback(() => {
    if (state.session) {
      setState((prev) => ({
        ...prev,
        session: prev.session
          ? {
              ...prev.session,
              lastActivity: new Date(),
            }
          : null,
      }));
    }
  }, [state.session]);

  const resetError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // ==================== EFFECTS ====================

  // Auto-expire session
  useEffect(() => {
    if (state.session && state.session.isActive) {
      const timeRemaining = calculateTimeRemaining(state.session);

      if (timeRemaining <= 0) {
        logger.info("Admin session expired, ending session");
        endSession();
      }
    }
  }, [state.session, endSession]);

  // Activity tracking timer
  useEffect(() => {
    if (state.session && state.session.isActive) {
      activityTimerRef.current = setInterval(() => {
        refreshSession();
      }, state.config.activityTrackingInterval);

      return () => {
        if (activityTimerRef.current) {
          clearInterval(activityTimerRef.current);
          activityTimerRef.current = null;
        }
      };
    }
  }, [state.session, state.config.activityTrackingInterval, refreshSession]);

  // Auto-extend session if there's activity
  useEffect(() => {
    if (computedValues.shouldAutoExtend && !warningShownRef.current) {
      logger.info("Auto-extending session due to activity");
      extendSession();
    }
  }, [computedValues.shouldAutoExtend, extendSession]);

  // Clear session if relationship changes
  useEffect(() => {
    if (state.session && state.session.relationshipId !== relationshipId) {
      logger.info("Relationship changed, ending current admin session");
      endSession();
    }
  }, [relationshipId, state.session, endSession]);

  // ==================== RETURN ====================

  const actions: AdminSessionActions = {
    startSession,
    endSession,
    extendSession,
    validatePermission,
    logAction,
    refreshSession,
    resetError,
  };

  return {
    // State
    ...state,

    // Computed
    ...computedValues,
    hasPermission,

    // Actions
    ...actions,
  };
};

export type UseAdminSessionReturn = ReturnType<typeof useAdminSession>;
