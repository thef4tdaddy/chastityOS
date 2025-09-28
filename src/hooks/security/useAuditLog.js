import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, addDoc, query, orderBy, limit, getDocs, where, serverTimestamp, doc, updateDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';

// Audit action types
export const AuditAction = {
  // User actions
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  USER_REGISTER: 'user_register',
  
  // Profile actions
  PROFILE_UPDATE: 'profile_update',
  SETTINGS_CHANGE: 'settings_change',
  PASSWORD_CHANGE: 'password_change',
  
  // Session actions
  SESSION_START: 'session_start',
  SESSION_END: 'session_end',
  SESSION_EXTEND: 'session_extend',
  EMERGENCY_UNLOCK: 'emergency_unlock',
  
  // Data actions
  EVENT_LOG: 'event_log',
  DATA_EXPORT: 'data_export',
  DATA_DELETE: 'data_delete',
  
  // Keyholder actions
  KEYHOLDER_ACCESS: 'keyholder_access',
  KEYHOLDER_CONTROL: 'keyholder_control',
  TASK_ASSIGN: 'task_assign',
  REWARD_ASSIGN: 'reward_assign',
  PUNISHMENT_ASSIGN: 'punishment_assign',
  
  // Security actions
  PERMISSION_CHECK: 'permission_check',
  PERMISSION_GRANT: 'permission_grant',
  PERMISSION_DENY: 'permission_deny',
  SECURITY_ALERT: 'security_alert',
  
  // System actions
  SYSTEM_ERROR: 'system_error',
  SYSTEM_WARNING: 'system_warning'
};

// Audit categories
export const AuditCategory = {
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  DATA_ACCESS: 'data_access',
  DATA_MODIFICATION: 'data_modification',
  SECURITY: 'security',
  SYSTEM: 'system',
  USER_ACTION: 'user_action',
  KEYHOLDER_ACTION: 'keyholder_action'
};

// Audit severity levels
export const AuditSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Audit outcomes
export const AuditOutcome = {
  SUCCESS: 'success',
  FAILURE: 'failure',
  PARTIAL: 'partial',
  ERROR: 'error'
};

// Export formats
export const ExportFormat = {
  JSON: 'json',
  CSV: 'csv',
  PDF: 'pdf'
};

// Default privacy settings
const DEFAULT_PRIVACY_SETTINGS = {
  shareWithKeyholder: false,
  retentionDays: 365,
  includeIPAddress: false,
  includeUserAgent: false,
  allowExport: true
};

export const useAuditLog = (userId, relationshipId = null) => {
  const [recentEntries, setRecentEntries] = useState([]);
  const [filters, setFilters] = useState({
    category: null,
    severity: null,
    dateRange: null,
    action: null
  });
  const [privacySettings, setPrivacySettings] = useState(DEFAULT_PRIVACY_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch recent audit entries
  const fetchRecentEntries = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const auditRef = collection(db, 'users', userId, 'auditLog');
      let auditQuery = query(
        auditRef,
        orderBy('timestamp', 'desc'),
        limit(100)
      );

      // Apply filters if set
      if (filters.category) {
        auditQuery = query(auditQuery, where('category', '==', filters.category));
      }
      if (filters.severity) {
        auditQuery = query(auditQuery, where('severity', '==', filters.severity));
      }

      const snapshot = await getDocs(auditQuery);
      const entries = [];
      
      snapshot.forEach(doc => {
        entries.push({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        });
      });

      setRecentEntries(entries);
    } catch (error) {
      console.error('Error fetching audit entries:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, filters]);

  // Fetch privacy settings
  const fetchPrivacySettings = useCallback(async () => {
    if (!userId) return;

    try {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const settings = userDoc.data().auditPrivacySettings || DEFAULT_PRIVACY_SETTINGS;
        setPrivacySettings(settings);
      }
    } catch (error) {
      console.error('Error fetching privacy settings:', error);
    }
  }, [userId]);

  // Initialize on mount
  useEffect(() => {
    fetchRecentEntries();
    fetchPrivacySettings();
  }, [fetchRecentEntries, fetchPrivacySettings]);

  // Log an action to the audit trail
  const logAction = useCallback(async (action, details, context = {}) => {
    if (!userId) return;

    try {
      const auditRef = collection(db, 'users', userId, 'auditLog');
      
      // Determine category and severity based on action
      const category = getCategoryForAction(action);
      const severity = getSeverityForAction(action);
      
      const auditEntry = {
        timestamp: serverTimestamp(),
        userId,
        action,
        category,
        context: {
          relationshipId,
          sessionId: context.sessionId || null,
          targetUserId: context.targetUserId || null,
          resourceType: context.resourceType || null,
          resourceId: context.resourceId || null,
          ...context.additionalContext
        },
        details,
        severity,
        ipAddress: privacySettings.includeIPAddress ? context.ipAddress : null,
        userAgent: privacySettings.includeUserAgent ? context.userAgent : null,
        outcome: context.outcome || AuditOutcome.SUCCESS
      };

      await addDoc(auditRef, auditEntry);
      
      // Update recent entries state
      setRecentEntries(prev => [
        { 
          id: Date.now().toString(), 
          ...auditEntry, 
          timestamp: new Date() 
        },
        ...prev.slice(0, 99)
      ]);
    } catch (error) {
      console.error('Error logging audit action:', error);
    }
  }, [userId, relationshipId, privacySettings]);

  // Log security event
  const logSecurityEvent = useCallback(async (event) => {
    await logAction(AuditAction.SECURITY_ALERT, {
      eventType: event.type,
      description: event.description,
      riskLevel: event.riskLevel,
      mitigation: event.mitigation
    }, {
      severity: AuditSeverity.HIGH,
      outcome: event.resolved ? AuditOutcome.SUCCESS : AuditOutcome.PARTIAL
    });
  }, [logAction]);

  // Log permission check
  const logPermissionCheck = useCallback(async (permission, granted, context = {}) => {
    await logAction(AuditAction.PERMISSION_CHECK, {
      permission,
      granted,
      context: context.context || null,
      reason: context.reason || null
    }, {
      severity: granted ? AuditSeverity.LOW : AuditSeverity.MEDIUM,
      outcome: granted ? AuditOutcome.SUCCESS : AuditOutcome.FAILURE
    });
  }, [logAction]);

  // Get entries by date range
  const getEntriesByDateRange = useCallback(async (start, end) => {
    if (!userId) return [];

    try {
      const auditRef = collection(db, 'users', userId, 'auditLog');
      const auditQuery = query(
        auditRef,
        where('timestamp', '>=', start),
        where('timestamp', '<=', end),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(auditQuery);
      const entries = [];
      
      snapshot.forEach(doc => {
        entries.push({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        });
      });

      return entries;
    } catch (error) {
      console.error('Error fetching entries by date range:', error);
      return [];
    }
  }, [userId]);

  // Get entries by category
  const getEntriesByCategory = useCallback(async (category) => {
    if (!userId) return [];

    try {
      const auditRef = collection(db, 'users', userId, 'auditLog');
      const auditQuery = query(
        auditRef,
        where('category', '==', category),
        orderBy('timestamp', 'desc'),
        limit(100)
      );

      const snapshot = await getDocs(auditQuery);
      const entries = [];
      
      snapshot.forEach(doc => {
        entries.push({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        });
      });

      return entries;
    } catch (error) {
      console.error('Error fetching entries by category:', error);
      return [];
    }
  }, [userId]);

  // Get entries by user
  const getEntriesByUser = useCallback(async (targetUserId) => {
    if (!userId) return [];

    try {
      const auditRef = collection(db, 'users', userId, 'auditLog');
      const auditQuery = query(
        auditRef,
        where('context.targetUserId', '==', targetUserId),
        orderBy('timestamp', 'desc'),
        limit(100)
      );

      const snapshot = await getDocs(auditQuery);
      const entries = [];
      
      snapshot.forEach(doc => {
        entries.push({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        });
      });

      return entries;
    } catch (error) {
      console.error('Error fetching entries by user:', error);
      return [];
    }
  }, [userId]);

  // Search entries
  const searchEntries = useCallback(async (searchQuery) => {
    if (!userId) return [];

    try {
      // Since Firestore doesn't support full-text search, we'll filter locally
      const filteredEntries = recentEntries.filter(entry => {
        const searchText = `${entry.action} ${entry.details} ${entry.category}`.toLowerCase();
        return searchText.includes(searchQuery.query.toLowerCase());
      });

      return filteredEntries;
    } catch (error) {
      console.error('Error searching entries:', error);
      return [];
    }
  }, [recentEntries, userId]);

  // Apply filters
  const applyFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Get security summary
  const getSecuritySummary = useCallback(() => {
    const securityEntries = recentEntries.filter(entry => 
      entry.category === AuditCategory.SECURITY ||
      entry.category === AuditCategory.AUTHORIZATION
    );

    const highSeverityCount = securityEntries.filter(entry => 
      entry.severity === AuditSeverity.HIGH || entry.severity === AuditSeverity.CRITICAL
    ).length;

    const failedActions = securityEntries.filter(entry => 
      entry.outcome === AuditOutcome.FAILURE
    ).length;

    return {
      totalSecurityEvents: securityEntries.length,
      highSeverityEvents: highSeverityCount,
      failedActions,
      lastSecurityEvent: securityEntries[0]?.timestamp || null,
      riskLevel: highSeverityCount > 5 ? 'high' : highSeverityCount > 2 ? 'medium' : 'low'
    };
  }, [recentEntries]);

  // Get compliance report
  const getComplianceReport = useCallback(() => {
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentEntries30 = recentEntries.filter(entry => entry.timestamp >= last30Days);

    const actionSummary = {};
    recentEntries30.forEach(entry => {
      actionSummary[entry.action] = (actionSummary[entry.action] || 0) + 1;
    });

    return {
      reportPeriod: '30 days',
      totalEvents: recentEntries30.length,
      actionSummary,
      securityEvents: recentEntries30.filter(entry => entry.category === AuditCategory.SECURITY).length,
      dataAccessEvents: recentEntries30.filter(entry => entry.category === AuditCategory.DATA_ACCESS).length,
      failureRate: recentEntries30.filter(entry => entry.outcome === AuditOutcome.FAILURE).length / recentEntries30.length,
      generatedAt: new Date()
    };
  }, [recentEntries]);

  // Export audit log
  const exportAuditLog = useCallback(async (format, exportFilters = {}) => {
    if (!userId) return null;

    const exportOptions = {
      format: ExportFormat.JSON,
      dateRange: null,
      includeDetails: true
    };

    try {
      let entriesToExport = recentEntries;

      // Apply export filters
      if (exportFilters.dateRange) {
        const { start, end } = exportFilters.dateRange;
        entriesToExport = await getEntriesByDateRange(start, end);
      }
      if (exportFilters.category) {
        entriesToExport = entriesToExport.filter(entry => entry.category === exportFilters.category);
      }

      const exportData = {
        userId,
        exportedAt: new Date(),
        format,
        totalEntries: entriesToExport.length,
        entries: entriesToExport.map(entry => ({
          timestamp: entry.timestamp,
          action: entry.action,
          category: entry.category,
          severity: entry.severity,
          outcome: entry.outcome,
          details: exportOptions.includeDetails ? entry.details : null,
          context: entry.context
        }))
      };

      // Log the export action
      await logAction(AuditAction.DATA_EXPORT, {
        format,
        entryCount: entriesToExport.length,
        filters: exportFilters
      });

      return exportData;
    } catch (error) {
      console.error('Error exporting audit log:', error);
      return null;
    }
  }, [userId, recentEntries, getEntriesByDateRange, logAction]);

  // Share with keyholder
  const shareWithKeyholder = useCallback(async (entryIds) => {
    if (!userId || !relationshipId) return;

    try {
      const entriesToShare = recentEntries.filter(entry => entryIds.includes(entry.id));
      
      // Create shared audit log entry
      const sharedAuditRef = collection(db, 'relationships', relationshipId, 'sharedAuditLog');
      
      for (const entry of entriesToShare) {
        await addDoc(sharedAuditRef, {
          ...entry,
          sharedBy: userId,
          sharedAt: serverTimestamp()
        });
      }

      // Log the sharing action
      await logAction(AuditAction.DATA_EXPORT, {
        action: 'share_with_keyholder',
        entryCount: entriesToShare.length,
        relationshipId
      });
    } catch (error) {
      console.error('Error sharing with keyholder:', error);
    }
  }, [userId, relationshipId, recentEntries, logAction]);

  // Update privacy settings
  const updatePrivacySettings = useCallback(async (settings) => {
    if (!userId) return;

    try {
      const userDocRef = doc(db, 'users', userId);
      const newSettings = { ...privacySettings, ...settings };
      
      await updateDoc(userDocRef, {
        auditPrivacySettings: newSettings
      });

      setPrivacySettings(newSettings);

      // Log the settings change
      await logAction(AuditAction.SETTINGS_CHANGE, {
        settingsType: 'audit_privacy',
        changes: settings
      });
    } catch (error) {
      console.error('Error updating privacy settings:', error);
    }
  }, [userId, privacySettings, logAction]);

  // Cleanup old entries
  const cleanupOldEntries = useCallback(async (retentionDays) => {
    if (!userId) return { deleted: 0, error: null };

    try {
      const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
      const auditRef = collection(db, 'users', userId, 'auditLog');
      const oldEntriesQuery = query(
        auditRef,
        where('timestamp', '<', cutoffDate)
      );

      const snapshot = await getDocs(oldEntriesQuery);
      let deletedCount = 0;

      // Note: In a real implementation, you'd want to use batch deletes
      // This is simplified for the example
      for (const doc of snapshot.docs) {
        await deleteDoc(doc.ref);
        deletedCount++;
      }

      // Log the cleanup action
      await logAction(AuditAction.DATA_DELETE, {
        action: 'cleanup_old_entries',
        deletedCount,
        retentionDays
      });

      return { deleted: deletedCount, error: null };
    } catch (error) {
      console.error('Error cleaning up old entries:', error);
      return { deleted: 0, error: error.message };
    }
  }, [userId, logAction]);

  // Helper functions
  const getCategoryForAction = (action) => {
    const categoryMap = {
      [AuditAction.USER_LOGIN]: AuditCategory.AUTHENTICATION,
      [AuditAction.USER_LOGOUT]: AuditCategory.AUTHENTICATION,
      [AuditAction.PERMISSION_CHECK]: AuditCategory.AUTHORIZATION,
      [AuditAction.DATA_EXPORT]: AuditCategory.DATA_ACCESS,
      [AuditAction.EVENT_LOG]: AuditCategory.DATA_MODIFICATION,
      [AuditAction.SECURITY_ALERT]: AuditCategory.SECURITY,
      [AuditAction.KEYHOLDER_ACCESS]: AuditCategory.KEYHOLDER_ACTION
    };
    
    return categoryMap[action] || AuditCategory.USER_ACTION;
  };

  const getSeverityForAction = (action) => {
    const severityMap = {
      [AuditAction.SECURITY_ALERT]: AuditSeverity.HIGH,
      [AuditAction.EMERGENCY_UNLOCK]: AuditSeverity.HIGH,
      [AuditAction.PERMISSION_DENY]: AuditSeverity.MEDIUM,
      [AuditAction.DATA_DELETE]: AuditSeverity.MEDIUM,
      [AuditAction.USER_LOGIN]: AuditSeverity.LOW,
      [AuditAction.EVENT_LOG]: AuditSeverity.LOW
    };
    
    return severityMap[action] || AuditSeverity.LOW;
  };

  // Computed values
  const totalEntries = recentEntries.length;
  const securityAlerts = recentEntries.filter(entry => entry.severity === AuditSeverity.HIGH).length;
  const lastLoginTime = recentEntries.find(entry => entry.action === AuditAction.USER_LOGIN)?.timestamp;
  
  const mostCommonActions = useMemo(() => {
    const actionCounts = {};
    recentEntries.forEach(entry => {
      actionCounts[entry.action] = (actionCounts[entry.action] || 0) + 1;
    });
    
    return Object.entries(actionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([action, count]) => ({ action, count }));
  }, [recentEntries]);
  
  const hasSecurityConcerns = recentEntries.some(entry => 
    entry.category === AuditCategory.SECURITY && entry.severity === AuditSeverity.HIGH
  );

    return {
      // Audit data
      recentEntries,
      categories: Object.values(AuditCategory),
      filters,
      isLoading,

      // Logging actions
      logAction,
      logSecurityEvent,
      logPermissionCheck,

      // Querying audit log
      getEntriesByDateRange,
      getEntriesByCategory,
      getEntriesByUser,
      searchEntries,

      // Filtering and analysis
      applyFilters,
      getSecuritySummary,
      getComplianceReport,

      // Export and sharing
      exportAuditLog,
      shareWithKeyholder,

      // Privacy and retention
      updatePrivacySettings,
      cleanupOldEntries,
      privacySettings,

      // Computed values
      totalEntries,
      securityAlerts,
      lastLoginTime,
      mostCommonActions,
      hasSecurityConcerns
    };
};