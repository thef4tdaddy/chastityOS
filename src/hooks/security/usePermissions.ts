/**
 * usePermissions - Granular Permission System Hook
 *
 * Provides comprehensive permission checking system that validates user permissions
 * in real-time across all application contexts.
 */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { UserRole } from "../../types/core";
import {
  Permission,
  PermissionState,
  PermissionContext,
  PermissionDetails,
  PermissionHistoryEntry,
  PermissionRequest,
  ElevatedAccessRequest,
  PermissionCategory,
  PermissionLevel,
  PermissionScope,
  RolePermission,
  ContextPermission,
  PermissionCheckLog,
} from "../../types/security";

interface UsePermissionsOptions {
  userId: string;
  context?: PermissionContext;
  cacheEnabled?: boolean;
  cacheTTL?: number; // milliseconds
}

export const usePermissions = (options: UsePermissionsOptions) => {
  const {
    userId,
    context,
    cacheEnabled = true,
    cacheTTL = 5 * 60 * 1000,
  } = options;

  // Permission state
  const [permissionState, setPermissionState] = useState<PermissionState>({
    userPermissions: [],
    rolePermissions: [],
    contextPermissions: [],
    permissionCache: {},
    permissionChecks: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user permissions on mount
  useEffect(() => {
    const loadPermissions = async () => {
      try {
        setLoading(true);
        setError(null);

        // In a real implementation, this would fetch from your backend/Firebase
        // For now, we'll simulate with default permissions based on user role
        const defaultPermissions = await getDefaultPermissions(userId);

        setPermissionState((prev) => ({
          ...prev,
          userPermissions: defaultPermissions.userPermissions,
          rolePermissions: defaultPermissions.rolePermissions,
          contextPermissions: defaultPermissions.contextPermissions,
        }));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load permissions",
        );
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadPermissions();
    }
  }, [userId]);

  // Core permission checking function
  const hasPermission = useCallback(
    (permission: string, checkContext?: PermissionContext): boolean => {
      const contextToUse = checkContext || context;
      const cacheKey = `${permission}_${JSON.stringify(contextToUse)}`;

      // Check cache first if enabled
      if (cacheEnabled) {
        const cached = permissionState.permissionCache[cacheKey];
        if (cached && cached.expiresAt > new Date()) {
          return cached.result;
        }
      }

      const hasAccess = checkPermissionAccess(
        permission,
        contextToUse,
        permissionState,
      );

      // Cache and log the result
      cacheAndLogPermissionCheck({
        cacheKey,
        hasAccess,
        permission,
        context: contextToUse,
        userId,
        cacheEnabled,
        cacheTTL,
        setPermissionState,
      });

      return hasAccess;
    },
    [permissionState, context, userId, cacheEnabled, cacheTTL],
  );

  // Check multiple permissions (any)
  const hasAnyPermission = useCallback(
    (permissions: string[], checkContext?: PermissionContext): boolean => {
      return permissions.some((permission) =>
        hasPermission(permission, checkContext),
      );
    },
    [hasPermission],
  );

  // Check multiple permissions (all)
  const hasAllPermissions = useCallback(
    (permissions: string[], checkContext?: PermissionContext): boolean => {
      return permissions.every((permission) =>
        hasPermission(permission, checkContext),
      );
    },
    [hasPermission],
  );

  // Role-based checks
  const hasRole = useCallback(
    (role: UserRole): boolean => {
      return permissionState.rolePermissions.some((rp) => rp.role === role);
    },
    [permissionState.rolePermissions],
  );

  // Action-based permission check
  const canPerformAction = useCallback(
    (action: string, target?: string): boolean => {
      const actionPermission = `${action}${target ? `_${target}` : ""}`;
      return hasPermission(actionPermission);
    },
    [hasPermission],
  );

  // Resource access check
  const canAccessResource = useCallback(
    (resource: string, action: string): boolean => {
      return hasPermission(`${resource}_${action}`);
    },
    [hasPermission],
  );

  // Data modification check
  const canModifyData = useCallback(
    (dataType: string, ownerId: string): boolean => {
      // Can modify own data or have admin permissions
      return userId === ownerId || hasPermission(`${dataType}_modify_any`);
    },
    [hasPermission, userId],
  );

  // Permission request
  const requestPermission = useCallback(
    async (
      permission: string,
      justification: string,
    ): Promise<PermissionRequest> => {
      // In real implementation, this would submit to backend
      const request: PermissionRequest = {
        id: `req_${Date.now()}`,
        userId,
        permission,
        justification,
        status: "pending",
        requestedAt: new Date(),
      };

      // Simulate async request submission
      return new Promise((resolve) => {
        setTimeout(() => resolve(request), 100);
      });
    },
    [userId],
  );

  // Elevated access request
  const requestElevatedAccess = useCallback(
    async (
      duration: number,
      reason: string,
    ): Promise<ElevatedAccessRequest> => {
      const request: ElevatedAccessRequest = {
        id: `elev_${Date.now()}`,
        userId,
        duration,
        reason,
        status: "pending",
        requestedAt: new Date(),
      };

      return new Promise((resolve) => {
        setTimeout(() => resolve(request), 100);
      });
    },
    [userId],
  );

  // Get permission details
  const getPermissionDetails = useCallback(
    (permission: string): PermissionDetails | null => {
      const userPerm = permissionState.userPermissions.find(
        (p) => p.name === permission,
      );
      if (!userPerm) return null;

      return {
        permission: userPerm,
        currentStatus: hasPermission(permission),
        reasons: ["User permission"],
        restrictions: [],
        expiresAt: userPerm.expiresAt,
      };
    },
    [permissionState.userPermissions, hasPermission],
  );

  // Get permission history
  const getPermissionHistory = useCallback((): PermissionHistoryEntry[] => {
    // In real implementation, this would fetch from backend
    return [];
  }, []);

  // Computed values
  const computedValues = useMemo(() => {
    const isAdmin = hasRole(UserRole.KEYHOLDER);
    const isKeyholder = hasRole(UserRole.KEYHOLDER);
    const canElevate = hasPermission("request_elevation");

    const hasExpiredPermissions = permissionState.userPermissions.some(
      (p) => p.expiresAt && p.expiresAt < new Date(),
    );

    const permissionLevel = calculateOverallPermissionLevel(
      permissionState.userPermissions,
    );

    return {
      isAdmin,
      isKeyholder,
      canElevate,
      hasExpiredPermissions,
      permissionLevel,
    };
  }, [permissionState.userPermissions, hasRole, hasPermission]);

  return {
    // Permission state
    permissions: permissionState.userPermissions,
    rolePermissions: permissionState.rolePermissions,
    contextPermissions: permissionState.contextPermissions,
    loading,
    error,

    // Permission checking
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,

    // Role-based checks
    hasRole,
    canPerformAction,

    // Context-specific checks
    canAccessResource,
    canModifyData,

    // Permission requests
    requestPermission,
    requestElevatedAccess,

    // Permission management
    getPermissionDetails,
    getPermissionHistory,

    // Computed values
    ...computedValues,
  };
};

// Helper functions
function matchesPermission(
  permission: Permission,
  requested: string,
  context?: PermissionContext,
): boolean {
  if (permission.name !== requested) return false;

  // Check if permission is expired
  if (permission.expiresAt && permission.expiresAt < new Date()) {
    return false;
  }

  // Check conditions if present
  if (permission.conditions && permission.conditions.length > 0) {
    return permission.conditions.every((condition) =>
      evaluateCondition(condition, context),
    );
  }

  return true;
}

function contextsMatch(
  permissionContext: PermissionContext,
  requestContext: PermissionContext,
): boolean {
  return (
    permissionContext.relationshipId === requestContext.relationshipId &&
    permissionContext.sessionId === requestContext.sessionId &&
    permissionContext.targetUserId === requestContext.targetUserId &&
    permissionContext.resourceType === requestContext.resourceType &&
    permissionContext.resourceId === requestContext.resourceId
  );
}

function evaluateCondition(
  _condition: {
    type: string;
    value: string | number | boolean | Date | string[];
    operator: string;
  },
  _context?: PermissionContext,
): boolean {
  // Simplified condition evaluation
  // In real implementation, this would be more sophisticated
  return true;
}

function calculateOverallPermissionLevel(
  permissions: Permission[],
): PermissionLevel {
  if (permissions.some((p) => p.level === PermissionLevel.ADMIN)) {
    return PermissionLevel.ADMIN;
  }
  if (permissions.some((p) => p.level === PermissionLevel.WRITE)) {
    return PermissionLevel.WRITE;
  }
  if (permissions.some((p) => p.level === PermissionLevel.READ)) {
    return PermissionLevel.READ;
  }
  return PermissionLevel.NONE;
}

async function getDefaultPermissions(_userId: string): Promise<{
  userPermissions: Permission[];
  rolePermissions: RolePermission[];
  contextPermissions: ContextPermission[];
}> {
  // Simulate fetching default permissions
  // In real implementation, this would query your backend

  const defaultUserPermissions: Permission[] = [
    {
      id: "session_manage_own",
      name: "session_manage_own",
      category: PermissionCategory.SESSION,
      level: PermissionLevel.WRITE,
      scope: PermissionScope.SELF,
    },
    {
      id: "profile_edit_own",
      name: "profile_edit_own",
      category: PermissionCategory.PROFILE,
      level: PermissionLevel.WRITE,
      scope: PermissionScope.SELF,
    },
  ];

  const defaultRolePermissions: RolePermission[] = [
    {
      role: UserRole.SUBMISSIVE,
      permissions: defaultUserPermissions,
    },
  ];

  return {
    userPermissions: defaultUserPermissions,
    rolePermissions: defaultRolePermissions,
    contextPermissions: [],
  };
}

// Permission checking helper functions
function checkPermissionAccess(
  permission: string,
  context: PermissionContext | undefined,
  permissionState: PermissionState,
): boolean {
  let hasAccess = false;

  // Check user permissions
  for (const userPerm of permissionState.userPermissions) {
    if (matchesPermission(userPerm, permission, context)) {
      hasAccess = true;
      break;
    }
  }

  // Check role permissions if user permission not found
  if (!hasAccess) {
    for (const rolePerm of permissionState.rolePermissions) {
      for (const perm of rolePerm.permissions) {
        if (matchesPermission(perm, permission, context)) {
          hasAccess = true;
          break;
        }
      }
      if (hasAccess) break;
    }
  }

  // Check context permissions
  if (!hasAccess && context) {
    for (const contextPerm of permissionState.contextPermissions) {
      if (contextsMatch(contextPerm.context, context)) {
        for (const perm of contextPerm.permissions) {
          if (matchesPermission(perm, permission, context)) {
            hasAccess = true;
            break;
          }
        }
      }
      if (hasAccess) break;
    }
  }

  return hasAccess;
}

function cacheAndLogPermissionCheck(params: {
  cacheKey: string;
  hasAccess: boolean;
  permission: string;
  context: PermissionContext | undefined;
  userId: string;
  cacheEnabled: boolean;
  cacheTTL: number;
  setPermissionState: React.Dispatch<React.SetStateAction<PermissionState>>;
}): void {
  const {
    cacheKey,
    hasAccess,
    permission,
    context,
    userId,
    cacheEnabled,
    cacheTTL,
    setPermissionState,
  } = params;
  // Cache the result
  if (cacheEnabled) {
    setPermissionState((prev) => ({
      ...prev,
      permissionCache: {
        ...prev.permissionCache,
        [cacheKey]: {
          result: hasAccess,
          timestamp: new Date(),
          expiresAt: new Date(Date.now() + cacheTTL),
        },
      },
    }));
  }

  // Log the permission check
  const checkLog: PermissionCheckLog = {
    permission,
    context,
    result: hasAccess,
    timestamp: new Date(),
    userId,
  };

  setPermissionState((prev) => ({
    ...prev,
    permissionChecks: [...prev.permissionChecks.slice(-99), checkLog], // Keep last 100 checks
  }));
}
