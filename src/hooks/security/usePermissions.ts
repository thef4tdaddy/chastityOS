/**
 * usePermissions - Granular Permission System Hook
 *
 * Provides comprehensive permission checking system that validates user permissions
 * in real-time across all application contexts.
 */
import React, { useState, useEffect, useMemo } from "react";
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

// Helper to load user permissions
async function loadUserPermissions(
  userId: string,
  setPermissionState: React.Dispatch<React.SetStateAction<PermissionState>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
): Promise<void> {
  try {
    setLoading(true);
    setError(null);

    const defaultPermissions = await getDefaultPermissions(userId);

    setPermissionState((prev) => ({
      ...prev,
      userPermissions: defaultPermissions.userPermissions,
      rolePermissions: defaultPermissions.rolePermissions,
      contextPermissions: defaultPermissions.contextPermissions,
    }));
  } catch (err) {
    setError(err instanceof Error ? err.message : "Failed to load permissions");
  } finally {
    setLoading(false);
  }
}

// Helper to create permission request
async function createPermissionRequest(
  userId: string,
  permission: string,
  justification: string,
): Promise<PermissionRequest> {
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
}

// Helper to create elevated access request
async function createElevatedAccessRequest(
  userId: string,
  duration: number,
  reason: string,
): Promise<ElevatedAccessRequest> {
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
}

// Helper to compute permission-based values
function computePermissionValues(
  permissionState: PermissionState,
  hasRole: (role: UserRole) => boolean,
  hasPermission: (permission: string) => boolean,
) {
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
}

// Helper to create the core hasPermission function
function createHasPermissionCheck(params: {
  permissionState: PermissionState;
  context: PermissionContext | undefined;
  userId: string;
  cacheEnabled: boolean;
  cacheTTL: number;
  setPermissionState: React.Dispatch<React.SetStateAction<PermissionState>>;
}) {
  const {
    permissionState,
    context,
    userId,
    cacheEnabled,
    cacheTTL,
    setPermissionState,
  } = params;

  return (permission: string, checkContext?: PermissionContext): boolean => {
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
  };
}

// Helper to create permission check callbacks
function createPermissionChecks(params: {
  permissionState: PermissionState;
  context: PermissionContext | undefined;
  userId: string;
  cacheEnabled: boolean;
  cacheTTL: number;
  setPermissionState: React.Dispatch<React.SetStateAction<PermissionState>>;
}) {
  const { permissionState, userId } = params;

  const hasPermission = createHasPermissionCheck(params);

  const hasAnyPermission = (
    permissions: string[],
    checkContext?: PermissionContext,
  ): boolean => {
    return permissions.some((permission) =>
      hasPermission(permission, checkContext),
    );
  };

  const hasAllPermissions = (
    permissions: string[],
    checkContext?: PermissionContext,
  ): boolean => {
    return permissions.every((permission) =>
      hasPermission(permission, checkContext),
    );
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole: (role: UserRole): boolean =>
      permissionState.rolePermissions.some((rp) => rp.role === role),
    canPerformAction: (action: string, target?: string): boolean => {
      const actionPermission = `${action}${target ? `_${target}` : ""}`;
      return hasPermission(actionPermission);
    },
    canAccessResource: (resource: string, action: string): boolean =>
      hasPermission(`${resource}_${action}`),
    canModifyData: (dataType: string, ownerId: string): boolean =>
      userId === ownerId || hasPermission(`${dataType}_modify_any`),
  };
}

// Helper to get permission details
function getPermissionDetailsHelper(
  permission: string,
  permissionState: PermissionState,
  hasPermission: (permission: string) => boolean,
): PermissionDetails | null {
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
}

// Initial permission state
const initialPermissionState: PermissionState = {
  userPermissions: [],
  rolePermissions: [],
  contextPermissions: [],
  permissionCache: {},
  permissionChecks: [],
};

export const usePermissions = (options: UsePermissionsOptions) => {
  const {
    userId,
    context,
    cacheEnabled = true,
    cacheTTL = 5 * 60 * 1000,
  } = options;

  const [permissionState, setPermissionState] = useState(
    initialPermissionState,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user permissions on mount
  useEffect(() => {
    if (userId) {
      loadUserPermissions(userId, setPermissionState, setError, setLoading);
    }
  }, [userId]);

  // Create permission check functions
  const permissionChecks = useMemo(
    () =>
      createPermissionChecks({
        permissionState,
        context,
        userId,
        cacheEnabled,
        cacheTTL,
        setPermissionState,
      }),
    [permissionState, context, userId, cacheEnabled, cacheTTL],
  );

  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    canPerformAction,
    canAccessResource,
    canModifyData,
  } = permissionChecks;

  // Permission management functions
  const management = useMemo(
    () => ({
      requestPermission: (permission: string, justification: string) =>
        createPermissionRequest(userId, permission, justification),
      requestElevatedAccess: (duration: number, reason: string) =>
        createElevatedAccessRequest(userId, duration, reason),
      getPermissionDetails: (permission: string) =>
        getPermissionDetailsHelper(permission, permissionState, hasPermission),
      getPermissionHistory: (): PermissionHistoryEntry[] => [],
    }),
    [userId, permissionState, hasPermission],
  );

  // Computed values
  const computedValues = useMemo(
    () => computePermissionValues(permissionState, hasRole, hasPermission),
    [permissionState, hasRole, hasPermission],
  );

  return {
    permissions: permissionState.userPermissions,
    rolePermissions: permissionState.rolePermissions,
    contextPermissions: permissionState.contextPermissions,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    canPerformAction,
    canAccessResource,
    canModifyData,
    ...management,
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
