/**
 * useSecuritySettings - Security Configuration Hook
 *
 * Manages comprehensive security settings including session timeouts,
 * IP restrictions, and security policies.
 */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  SecuritySettingsState,
  SessionSecuritySettings,
  AccessControlSettings,
  MonitoringSettings,
  PrivacySecuritySettings,
  DeviceInfo,
  SecurityScore,
  SecurityRecommendation,
  SecurityHealthCheck,
  SecurityIssue,
} from "../../types/security";

interface UseSecuritySettingsOptions {
  userId: string;
  autoSave?: boolean;
  syncInterval?: number; // minutes
}

const defaultSessionSettings: SessionSecuritySettings = {
  sessionTimeout: 60, // 1 hour
  adminSessionTimeout: 30, // 30 minutes
  requireReauthForSensitive: true,
  logoutOnBrowserClose: false,
  allowConcurrentSessions: true,
  maxConcurrentSessions: 3,
};

const defaultAccessSettings: AccessControlSettings = {
  trustedDevices: [],
  ipWhitelist: [],
  geoRestrictions: [],
  timeRestrictions: [],
};

const defaultMonitoringSettings: MonitoringSettings = {
  enableSecurityAlerts: true,
  alertThresholds: [
    {
      type: "failed_logins",
      count: 5,
      timeWindow: 15,
      action: "alert",
    },
    {
      type: "permission_violations",
      count: 3,
      timeWindow: 60,
      action: "block",
    },
  ],
  notificationChannels: ["in_app"],
  logLevel: "standard",
};

const defaultPrivacySettings: PrivacySecuritySettings = {
  shareAuditWithKeyholder: false,
  anonymizeOldData: true,
  dataRetentionDays: 365,
  allowDataExport: true,
  requirePasswordForSensitiveActions: true,
};

// Helper to load security settings
async function loadSecuritySettings(
  userId: string,
  setSecurityState: React.Dispatch<React.SetStateAction<SecuritySettingsState>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
): Promise<void> {
  try {
    setLoading(true);
    setError(null);

    const settings = await fetchSecuritySettings(userId);
    const mergedSettings = mergeWithDefaultSettings(settings);
    setSecurityState(mergedSettings);
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Failed to load security settings",
    );
  } finally {
    setLoading(false);
  }
}

// Initial security state
const initialSecurityState: SecuritySettingsState = {
  sessionSettings: defaultSessionSettings,
  accessSettings: defaultAccessSettings,
  monitoringSettings: defaultMonitoringSettings,
  privacySettings: defaultPrivacySettings,
};

export const useSecuritySettings = (options: UseSecuritySettingsOptions) => {
  const { userId, autoSave = true } = options;

  const [securityState, setSecurityState] = useState(initialSecurityState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load settings on mount
  useEffect(() => {
    if (userId) {
      loadSecuritySettings(userId, setSecurityState, setError, setLoading);
    }
  }, [userId]);

  // Auto-save when settings change
  useEffect(() => {
    if (autoSave && hasUnsavedChanges && !loading) {
      const saveTimer = setTimeout(() => {
        handleAutoSave(userId, securityState, setHasUnsavedChanges, setError);
      }, 2000); // 2 second debounce

      return () => clearTimeout(saveTimer);
    }
    // 'loading' is a state variable, not a store action - safe to include in deps
    // eslint-disable-next-line zustand-safe-patterns/zustand-no-store-actions-in-deps
  }, [hasUnsavedChanges, autoSave, loading, userId, securityState]);

  // Update session settings
  const updateSessionSettings = useCallback(
    async (settings: Partial<SessionSecuritySettings>): Promise<void> => {
      setSecurityState((prev) => ({
        ...prev,
        sessionSettings: {
          ...prev.sessionSettings,
          ...settings,
        },
      }));
      setHasUnsavedChanges(true);

      if (!autoSave) {
        await saveSecuritySettings(userId, {
          ...securityState,
          sessionSettings: {
            ...securityState.sessionSettings,
            ...settings,
          },
        });
      }
    },
    [userId, autoSave, securityState],
  );

  // Set session timeout
  const setSessionTimeout = useCallback(
    async (minutes: number): Promise<void> => {
      if (minutes < 5 || minutes > 480) {
        // 5 minutes to 8 hours
        throw new Error(
          "Session timeout must be between 5 minutes and 8 hours",
        );
      }

      await updateSessionSettings({ sessionTimeout: minutes });
    },
    [updateSessionSettings],
  );

  // Enable/disable reauthentication requirement
  const enableReauthRequirement = useCallback(
    async (enabled: boolean): Promise<void> => {
      await updateSessionSettings({ requireReauthForSensitive: enabled });
    },
    [updateSessionSettings],
  );

  // Update access control settings
  const updateAccessSettings = useCallback(
    async (settings: Partial<AccessControlSettings>): Promise<void> => {
      setSecurityState((prev) => ({
        ...prev,
        accessSettings: {
          ...prev.accessSettings,
          ...settings,
        },
      }));
      setHasUnsavedChanges(true);

      if (!autoSave) {
        await saveSecuritySettings(userId, {
          ...securityState,
          accessSettings: {
            ...securityState.accessSettings,
            ...settings,
          },
        });
      }
    },
    [userId, autoSave, securityState],
  );

  // Add trusted device
  const addTrustedDevice = useCallback(
    async (device: DeviceInfo): Promise<void> => {
      const updatedDevices = [
        ...securityState.accessSettings.trustedDevices,
        device,
      ];
      await updateAccessSettings({ trustedDevices: updatedDevices });
    },
    [securityState.accessSettings.trustedDevices, updateAccessSettings],
  );

  // Remove trusted device
  const removeTrustedDevice = useCallback(
    async (deviceId: string): Promise<void> => {
      const updatedDevices = securityState.accessSettings.trustedDevices.filter(
        (device) => device.id !== deviceId,
      );
      await updateAccessSettings({ trustedDevices: updatedDevices });
    },
    [securityState.accessSettings.trustedDevices, updateAccessSettings],
  );

  // Update monitoring settings
  const updateMonitoringSettings = useCallback(
    async (settings: Partial<MonitoringSettings>): Promise<void> => {
      setSecurityState((prev) => ({
        ...prev,
        monitoringSettings: {
          ...prev.monitoringSettings,
          ...settings,
        },
      }));
      setHasUnsavedChanges(true);

      if (!autoSave) {
        await saveSecuritySettings(userId, {
          ...securityState,
          monitoringSettings: {
            ...securityState.monitoringSettings,
            ...settings,
          },
        });
      }
    },
    [userId, autoSave, securityState],
  );

  // Enable/disable security alerts
  const enableSecurityAlerts = useCallback(
    async (enabled: boolean): Promise<void> => {
      await updateMonitoringSettings({ enableSecurityAlerts: enabled });
    },
    [updateMonitoringSettings],
  );

  // Update privacy settings
  const updatePrivacySettings = useCallback(
    async (settings: Partial<PrivacySecuritySettings>): Promise<void> => {
      setSecurityState((prev) => ({
        ...prev,
        privacySettings: {
          ...prev.privacySettings,
          ...settings,
        },
      }));
      setHasUnsavedChanges(true);

      if (!autoSave) {
        await saveSecuritySettings(userId, {
          ...securityState,
          privacySettings: {
            ...securityState.privacySettings,
            ...settings,
          },
        });
      }
    },
    [userId, autoSave, securityState],
  );

  // Get security score
  const getSecurityScore = useMemo(
    () => () => calculateSecurityScore(securityState),
    [securityState],
  );

  // Get security recommendations
  const getSecurityRecommendations = useMemo(
    () => () => generateSecurityRecommendations(securityState),
    [securityState],
  );

  // Check security health
  const checkSecurityHealth = useMemo(
    () => (): SecurityHealthCheck => {
      const issues = findSecurityIssues(securityState);

      let status: SecurityHealthCheck["status"] = "healthy";
      if (issues.some((issue) => issue.severity === "critical")) {
        status = "critical";
      } else if (issues.some((issue) => issue.severity === "high")) {
        status = "critical";
      } else if (issues.some((issue) => issue.severity === "medium")) {
        status = "warning";
      }

      return {
        status,
        issues,
        lastCheck: new Date(),
        nextCheck: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };
    },
    [securityState],
  );

  // Computed values
  const computedValues = useMemo(() => {
    const securityLevel = calculateSecurityLevel(
      securityState.sessionSettings,
      securityState.accessSettings,
    );

    const isSecure = securityLevel >= "medium";
    const needsAttention = getSecurityRecommendations().some(
      (r) => r.priority === "high",
    );
    const sessionTimeoutMinutes = securityState.sessionSettings.sessionTimeout;
    const hasStrictSecurity = securityLevel === "strict";

    return {
      isSecure,
      needsAttention,
      sessionTimeoutMinutes,
      hasStrictSecurity,
    };
  }, [securityState, getSecurityRecommendations]);

  return {
    // Settings state
    sessionSettings: securityState.sessionSettings,
    accessSettings: securityState.accessSettings,
    monitoringSettings: securityState.monitoringSettings,
    privacySettings: securityState.privacySettings,
    loading,
    error,
    hasUnsavedChanges,

    // Session management
    updateSessionSettings,
    setSessionTimeout,
    enableReauthRequirement,

    // Access control
    updateAccessSettings,
    addTrustedDevice,
    removeTrustedDevice,

    // Security monitoring
    updateMonitoringSettings,
    enableSecurityAlerts,

    // Privacy controls
    updatePrivacySettings,

    // Security status
    getSecurityScore,
    getSecurityRecommendations,
    checkSecurityHealth,

    // Computed values
    ...computedValues,
  };
};

// Helper functions
async function fetchSecuritySettings(
  _userId: string,
): Promise<Partial<SecuritySettingsState>> {
  // In real implementation, fetch from backend/Firebase
  // For now, return default settings
  return {
    sessionSettings: defaultSessionSettings,
    accessSettings: defaultAccessSettings,
    monitoringSettings: defaultMonitoringSettings,
    privacySettings: defaultPrivacySettings,
  };
}

async function saveSecuritySettings(
  _userId: string,
  _settings: SecuritySettingsState,
): Promise<void> {
  // In real implementation, save to backend/Firebase
}

function calculateSecurityScore(
  settings: SecuritySettingsState,
): SecurityScore {
  let authScore = 50;
  let accessScore = 50;
  let monitoringScore = 50;
  let privacyScore = 50;

  // Authentication scoring
  if (settings.sessionSettings.requireReauthForSensitive) authScore += 15;
  if (settings.sessionSettings.sessionTimeout <= 60) authScore += 10;
  if (settings.sessionSettings.logoutOnBrowserClose) authScore += 10;
  if (!settings.sessionSettings.allowConcurrentSessions) authScore += 15;

  // Access control scoring
  if (settings.accessSettings.trustedDevices.length > 0) accessScore += 20;
  if (settings.accessSettings.ipWhitelist.length > 0) accessScore += 15;
  if (settings.accessSettings.geoRestrictions.length > 0) accessScore += 10;
  if (settings.accessSettings.timeRestrictions.length > 0) accessScore += 5;

  // Monitoring scoring
  if (settings.monitoringSettings.enableSecurityAlerts) monitoringScore += 20;
  if (settings.monitoringSettings.logLevel === "detailed")
    monitoringScore += 15;
  if (settings.monitoringSettings.alertThresholds.length > 0)
    monitoringScore += 15;

  // Privacy scoring
  if (settings.privacySettings.anonymizeOldData) privacyScore += 15;
  if (settings.privacySettings.requirePasswordForSensitiveActions)
    privacyScore += 20;
  if (settings.privacySettings.dataRetentionDays <= 365) privacyScore += 15;

  // Cap scores at 100
  authScore = Math.min(100, authScore);
  accessScore = Math.min(100, accessScore);
  monitoringScore = Math.min(100, monitoringScore);
  privacyScore = Math.min(100, privacyScore);

  const overall = Math.round(
    (authScore + accessScore + monitoringScore + privacyScore) / 4,
  );

  const recommendations = generateSecurityRecommendations(settings);

  return {
    overall,
    breakdown: {
      authentication: authScore,
      access_control: accessScore,
      monitoring: monitoringScore,
      privacy: privacyScore,
    },
    recommendations,
  };
}

function generateSecurityRecommendations(
  settings: SecuritySettingsState,
): SecurityRecommendation[] {
  const recommendations: SecurityRecommendation[] = [];

  // Session recommendations
  if (settings.sessionSettings.sessionTimeout > 120) {
    recommendations.push({
      id: "session_timeout",
      title: "Reduce session timeout",
      description:
        "Consider reducing session timeout to 2 hours or less for better security",
      priority: "medium",
      category: "authentication",
      action: "Reduce session timeout in settings",
    });
  }

  if (!settings.sessionSettings.requireReauthForSensitive) {
    recommendations.push({
      id: "reauth_sensitive",
      title: "Enable reauthentication for sensitive actions",
      description: "Require password confirmation for sensitive operations",
      priority: "high",
      category: "authentication",
      action: "Enable reauthentication requirement",
    });
  }

  // Access control recommendations
  if (settings.accessSettings.trustedDevices.length === 0) {
    recommendations.push({
      id: "trusted_devices",
      title: "Register trusted devices",
      description:
        "Register your commonly used devices for better security tracking",
      priority: "low",
      category: "access_control",
      action: "Add trusted devices in access control settings",
    });
  }

  // Monitoring recommendations
  if (!settings.monitoringSettings.enableSecurityAlerts) {
    recommendations.push({
      id: "security_alerts",
      title: "Enable security alerts",
      description: "Stay informed about security events with real-time alerts",
      priority: "high",
      category: "monitoring",
      action: "Enable security alerts in monitoring settings",
    });
  }

  // Privacy recommendations
  if (!settings.privacySettings.anonymizeOldData) {
    recommendations.push({
      id: "anonymize_data",
      title: "Enable data anonymization",
      description: "Automatically anonymize old audit data for better privacy",
      priority: "medium",
      category: "privacy",
      action: "Enable data anonymization in privacy settings",
    });
  }

  return recommendations;
}

function findSecurityIssues(settings: SecuritySettingsState): SecurityIssue[] {
  const issues: SecurityIssue[] = [];

  // Check for critical issues
  if (settings.sessionSettings.sessionTimeout > 480) {
    // 8 hours
    issues.push({
      type: "long_session_timeout",
      severity: "high",
      description: "Session timeout is set to more than 8 hours",
      recommendation: "Reduce session timeout to improve security",
      autoFixable: true,
    });
  }

  if (!settings.sessionSettings.requireReauthForSensitive) {
    issues.push({
      type: "no_reauth_required",
      severity: "medium",
      description: "Sensitive actions do not require reauthentication",
      recommendation: "Enable reauthentication for sensitive operations",
      autoFixable: true,
    });
  }

  if (!settings.monitoringSettings.enableSecurityAlerts) {
    issues.push({
      type: "security_alerts_disabled",
      severity: "medium",
      description: "Security alerts are disabled",
      recommendation: "Enable security alerts to stay informed about threats",
      autoFixable: true,
    });
  }

  return issues;
}

function calculateSecurityLevel(
  sessionSettings: SessionSecuritySettings,
  accessSettings: AccessControlSettings,
): "low" | "medium" | "high" | "strict" {
  let score = 0;

  // Session security factors
  if (sessionSettings.requireReauthForSensitive) score += 2;
  if (sessionSettings.sessionTimeout <= 60) score += 2;
  if (sessionSettings.logoutOnBrowserClose) score += 1;
  if (!sessionSettings.allowConcurrentSessions) score += 2;

  // Access control factors
  if (accessSettings.trustedDevices.length > 0) score += 1;
  if (accessSettings.ipWhitelist.length > 0) score += 2;
  if (accessSettings.geoRestrictions.length > 0) score += 1;
  if (accessSettings.timeRestrictions.length > 0) score += 1;

  if (score >= 8) return "strict";
  if (score >= 6) return "high";
  if (score >= 3) return "medium";
  return "low";
}

// Settings management helper functions
function mergeWithDefaultSettings(
  settings: Partial<SecuritySettingsState>,
): SecuritySettingsState {
  return {
    sessionSettings: {
      ...defaultSessionSettings,
      ...settings.sessionSettings,
    },
    accessSettings: {
      ...defaultAccessSettings,
      ...settings.accessSettings,
    },
    monitoringSettings: {
      ...defaultMonitoringSettings,
      ...settings.monitoringSettings,
    },
    privacySettings: {
      ...defaultPrivacySettings,
      ...settings.privacySettings,
    },
  };
}

async function handleAutoSave(
  userId: string,
  securityState: SecuritySettingsState,
  setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>,
): Promise<void> {
  try {
    await saveSecuritySettings(userId, securityState);
    setHasUnsavedChanges(false);
  } catch (err) {
    setError(err instanceof Error ? err.message : "Failed to save settings");
  }
}
