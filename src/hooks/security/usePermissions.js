import { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, getDoc, setDoc, collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { logEvent } from '../../utils/logging';

// Permission categories
export const PermissionCategory = {
  SYSTEM: 'system',
  SESSION: 'session', 
  PROFILE: 'profile',
  KEYHOLDER: 'keyholder',
  DATA: 'data',
  SHARING: 'sharing'
};

// Permission levels
export const PermissionLevel = {
  BASIC: 'basic',
  ELEVATED: 'elevated', 
  ADMIN: 'admin',
  RESTRICTED: 'restricted'
};

// Permission scopes
export const PermissionScope = {
  SELF: 'self',
  RELATIONSHIP: 'relationship',
  GLOBAL: 'global'
};

// User roles
export const UserRole = {
  USER: 'user',
  KEYHOLDER: 'keyholder',
  ADMIN: 'admin'
};

// Default permissions for a basic user
const DEFAULT_PERMISSIONS = [
  {
    id: 'view_own_profile',
    name: 'View Own Profile',
    category: PermissionCategory.PROFILE,
    level: PermissionLevel.BASIC,
    scope: PermissionScope.SELF
  },
  {
    id: 'edit_own_profile',
    name: 'Edit Own Profile',
    category: PermissionCategory.PROFILE,
    level: PermissionLevel.BASIC,
    scope: PermissionScope.SELF
  },
  {
    id: 'start_session',
    name: 'Start Chastity Session',
    category: PermissionCategory.SESSION,
    level: PermissionLevel.BASIC,
    scope: PermissionScope.SELF
  },
  {
    id: 'view_own_data',
    name: 'View Own Data',
    category: PermissionCategory.DATA,
    level: PermissionLevel.BASIC,
    scope: PermissionScope.SELF
  },
  {
    id: 'log_events',
    name: 'Log Sexual Events',
    category: PermissionCategory.DATA,
    level: PermissionLevel.BASIC,
    scope: PermissionScope.SELF
  }
];

// Keyholder additional permissions
const KEYHOLDER_PERMISSIONS = [
  {
    id: 'control_partner_session',
    name: 'Control Partner Session',
    category: PermissionCategory.SESSION,
    level: PermissionLevel.ELEVATED,
    scope: PermissionScope.RELATIONSHIP
  },
  {
    id: 'view_partner_data',
    name: 'View Partner Data',
    category: PermissionCategory.DATA,
    level: PermissionLevel.ELEVATED,
    scope: PermissionScope.RELATIONSHIP
  },
  {
    id: 'manage_tasks',
    name: 'Manage Tasks',
    category: PermissionCategory.KEYHOLDER,
    level: PermissionLevel.ELEVATED,
    scope: PermissionScope.RELATIONSHIP
  },
  {
    id: 'add_rewards_punishments',
    name: 'Add Rewards/Punishments',
    category: PermissionCategory.KEYHOLDER,
    level: PermissionLevel.ELEVATED,
    scope: PermissionScope.RELATIONSHIP
  }
];

export const usePermissions = (userId, context = null) => {
  const [userPermissions, setUserPermissions] = useState([]);
  const [rolePermissions, setRolePermissions] = useState([]);
  const [contextPermissions, setContextPermissions] = useState([]);
  const [permissionCache, setPermissionCache] = useState(new Map());
  const [permissionChecks, setPermissionChecks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRoles, setUserRoles] = useState([UserRole.USER]);

  // Fetch user permissions from Firestore
  const fetchPermissions = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const permissions = userData.permissions || DEFAULT_PERMISSIONS;
        const roles = userData.roles || [UserRole.USER];
        
        setUserPermissions(permissions);
        setUserRoles(roles);
        
        // Add role-based permissions
        const rolePerms = [];
        if (roles.includes(UserRole.KEYHOLDER)) {
          rolePerms.push(...KEYHOLDER_PERMISSIONS);
        }
        setRolePermissions(rolePerms);
        
        // Initialize context permissions if context provided
        if (context) {
          const contextPerms = userData.contextPermissions?.[context] || [];
          setContextPermissions(contextPerms);
        }
      } else {
        // Initialize default permissions for new user
        await setDoc(userDocRef, {
          permissions: DEFAULT_PERMISSIONS,
          roles: [UserRole.USER],
          permissionSettings: {
            createdAt: serverTimestamp(),
            lastUpdated: serverTimestamp()
          }
        }, { merge: true });
        
        setUserPermissions(DEFAULT_PERMISSIONS);
        setUserRoles([UserRole.USER]);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, context]);

  // Initialize permissions on mount
  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // Combined permissions (user + role + context)
  const allPermissions = useMemo(() => {
    return [...userPermissions, ...rolePermissions, ...contextPermissions];
  }, [userPermissions, rolePermissions, contextPermissions]);

  // Check if user has specific permission
  const hasPermission = useCallback((permissionId, checkContext = null) => {
    const cacheKey = `${permissionId}_${checkContext || 'default'}`;
    
    // Check cache first
    if (permissionCache.has(cacheKey)) {
      return permissionCache.get(cacheKey);
    }
    
    const hasPermissionResult = allPermissions.some(permission => {
      if (permission.id === permissionId) {
        // Check context if specified
        if (checkContext && permission.scope === PermissionScope.RELATIONSHIP) {
          return checkContext === context;
        }
        return true;
      }
      return false;
    });
    
    // Cache result
    setPermissionCache(prev => new Map(prev).set(cacheKey, hasPermissionResult));
    
    // Log permission check
    const checkLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      permission: permissionId,
      context: checkContext,
      granted: hasPermissionResult,
      userId
    };
    
    setPermissionChecks(prev => [checkLog, ...prev.slice(0, 99)]); // Keep last 100 checks
    
    // Log to audit trail
    if (userId) {
      logEvent(userId, 'PERMISSION_CHECK', {
        permission: permissionId,
        granted: hasPermissionResult,
        context: checkContext
      });
    }
    
    return hasPermissionResult;
  }, [allPermissions, context, permissionCache, userId]);

  // Check if user has any of the specified permissions
  const hasAnyPermission = useCallback((permissionIds, checkContext = null) => {
    return permissionIds.some(permissionId => hasPermission(permissionId, checkContext));
  }, [hasPermission]);

  // Check if user has all specified permissions
  const hasAllPermissions = useCallback((permissionIds, checkContext = null) => {
    return permissionIds.every(permissionId => hasPermission(permissionId, checkContext));
  }, [hasPermission]);

  // Check if user has specific role
  const hasRole = useCallback((role) => {
    return userRoles.includes(role);
  }, [userRoles]);

  // Check if user can perform specific action
  const canPerformAction = useCallback((action, target = null) => {
    const actionPermissions = {
      'edit_profile': 'edit_own_profile',
      'start_session': 'start_session',
      'end_session': 'control_partner_session',
      'view_data': target === userId ? 'view_own_data' : 'view_partner_data',
      'log_event': 'log_events',
      'manage_tasks': 'manage_tasks',
      'add_reward': 'add_rewards_punishments'
    };
    
    const requiredPermission = actionPermissions[action];
    return requiredPermission ? hasPermission(requiredPermission) : false;
  }, [hasPermission, userId]);

  // Check if user can access resource
  const canAccessResource = useCallback((resource, action = 'view') => {
    const resourcePermissions = {
      'profile': action === 'view' ? 'view_own_profile' : 'edit_own_profile',
      'session_data': 'view_own_data',
      'event_log': 'view_own_data',
      'tasks': 'manage_tasks'
    };
    
    const requiredPermission = resourcePermissions[resource];
    return requiredPermission ? hasPermission(requiredPermission) : false;
  }, [hasPermission]);

  // Check if user can modify data
  const canModifyData = useCallback((dataType, ownerId) => {
    if (ownerId === userId) {
      return hasPermission('edit_own_profile') || hasPermission('log_events');
    }
    
    // Can only modify partner data if keyholder
    return hasRole(UserRole.KEYHOLDER) && hasPermission('view_partner_data');
  }, [hasPermission, hasRole, userId]);

  // Request additional permission
  const requestPermission = useCallback(async (permissionId, justification) => {
    if (!userId) return null;
    
    try {
      const requestsRef = collection(db, 'users', userId, 'permissionRequests');
      const request = {
        permission: permissionId,
        justification,
        status: 'pending',
        requestedAt: serverTimestamp(),
        requestedBy: userId
      };
      
      const docRef = await addDoc(requestsRef, request);
      
      // Log the request
      await logEvent(userId, 'PERMISSION_REQUEST', {
        permission: permissionId,
        justification,
        requestId: docRef.id
      });
      
      return { id: docRef.id, ...request };
    } catch (error) {
      console.error('Error requesting permission:', error);
      return null;
    }
  }, [userId]);

  // Request elevated access (temporary)
  const requestElevatedAccess = useCallback(async (duration, reason) => {
    if (!userId) return null;
    
    try {
      const requestsRef = collection(db, 'users', userId, 'elevatedAccessRequests');
      const request = {
        duration,
        reason,
        status: 'pending',
        requestedAt: serverTimestamp(),
        requestedBy: userId,
        expiresAt: new Date(Date.now() + duration * 1000)
      };
      
      const docRef = await addDoc(requestsRef, request);
      
      // Log the request
      await logEvent(userId, 'ELEVATED_ACCESS_REQUEST', {
        duration,
        reason,
        requestId: docRef.id
      });
      
      return { id: docRef.id, ...request };
    } catch (error) {
      console.error('Error requesting elevated access:', error);
      return null;
    }
  }, [userId]);

  // Get permission details
  const getPermissionDetails = useCallback((permissionId) => {
    return allPermissions.find(permission => permission.id === permissionId) || null;
  }, [allPermissions]);

  // Get permission history
  const getPermissionHistory = useCallback(async () => {
    if (!userId) return [];
    
    try {
      const historyRef = collection(db, 'users', userId, 'eventLog');
      const historyQuery = query(
        historyRef,
        orderBy('timestamp', 'desc'),
        limit(50)
      );
      
      const snapshot = await getDocs(historyQuery);
      const history = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.type === 'PERMISSION_CHECK' || data.type === 'PERMISSION_REQUEST') {
          history.push({
            id: doc.id,
            ...data
          });
        }
      });
      
      return history;
    } catch (error) {
      console.error('Error fetching permission history:', error);
      return [];
    }
  }, [userId]);

  // Calculate overall permission level
  const calculateOverallPermissionLevel = useCallback((permissions) => {
    const levels = permissions.map(p => p.level);
    
    if (levels.includes(PermissionLevel.ADMIN)) return PermissionLevel.ADMIN;
    if (levels.includes(PermissionLevel.ELEVATED)) return PermissionLevel.ELEVATED;
    if (levels.includes(PermissionLevel.BASIC)) return PermissionLevel.BASIC;
    
    return PermissionLevel.RESTRICTED;
  }, []);

  // Computed values
  const isAdmin = useMemo(() => hasRole(UserRole.ADMIN), [hasRole]);
  const isKeyholder = useMemo(() => hasRole(UserRole.KEYHOLDER), [hasRole]);
  const canElevate = useMemo(() => hasPermission('request_elevation'), [hasPermission]);
  const hasExpiredPermissions = useMemo(() => {
    return allPermissions.some(p => p.expiresAt && p.expiresAt < new Date());
  }, [allPermissions]);
  const permissionLevel = useMemo(() => {
    return calculateOverallPermissionLevel(allPermissions);
  }, [allPermissions, calculateOverallPermissionLevel]);

  return {
    // Permission state
    permissions: userPermissions,
    rolePermissions,
    contextPermissions,
    isLoading,
    
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
    isAdmin,
    isKeyholder,
    canElevate,
    hasExpiredPermissions,
    permissionLevel,
    
    // Additional data
    userRoles,
    allPermissions,
    permissionChecks: permissionChecks.slice(0, 10) // Return last 10 checks
  };
};