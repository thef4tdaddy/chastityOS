/**
 * Helper functions for security settings
 */
import React from "react";
import {
  SecuritySettingsState,
  SessionSecuritySettings,
  AccessControlSettings,
  MonitoringSettings,
  PrivacySecuritySettings,
  SecurityScore,
  SecurityRecommendation,
  SecurityIssue,
} from "../../types/security";

// Default settings
export const defaultSessionSettings: SessionSecuritySettings = {
  sessionTimeout: 60,
  adminSessionTimeout: 30,
  requireReauthForSensitive: true,
  logoutOnBrowserClose: false,
  allowConcurrentSessions: true,
  maxConcurrentSessions: 3,
};

export const defaultAccessSettings: AccessControlSettings = {
  trustedDevices: [],
  ipWhitelist: [],
  geoRestrictions: [],
  timeRestrictions: [],
};

export const defaultMonitoringSettings: MonitoringSettings = {
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

export const defaultPrivacySettings: PrivacySecuritySettings = {
  shareAuditWithKeyholder: false,
  anonymizeOldData: true,
  dataRetentionDays: 365,
  allowDataExport: true,
  requirePasswordForSensitiveActions: true,
};

// API functions
export async function fetchSecuritySettings(
  _userId: string,
): Promise<Partial<SecuritySettingsState>> {
  return {
    sessionSettings: defaultSessionSettings,
    accessSettings: defaultAccessSettings,
    monitoringSettings: defaultMonitoringSettings,
    privacySettings: defaultPrivacySettings,
  };
}

export async function saveSecuritySettings(
  _userId: string,
  _settings: SecuritySettingsState,
): Promise<void> {
  // In real implementation, save to backend/Firebase
}

// Scoring and recommendations
export function calculateSecurityScore(
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

export function generateSecurityRecommendations(
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

export function findSecurityIssues(
  settings: SecuritySettingsState,
): SecurityIssue[] {
  const issues: SecurityIssue[] = [];

  if (settings.sessionSettings.sessionTimeout > 480) {
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

export function calculateSecurityLevel(
  sessionSettings: SessionSecuritySettings,
  accessSettings: AccessControlSettings,
): "low" | "medium" | "high" | "strict" {
  let score = 0;

  if (sessionSettings.requireReauthForSensitive) score += 2;
  if (sessionSettings.sessionTimeout <= 60) score += 2;
  if (sessionSettings.logoutOnBrowserClose) score += 1;
  if (!sessionSettings.allowConcurrentSessions) score += 2;

  if (accessSettings.trustedDevices.length > 0) score += 1;
  if (accessSettings.ipWhitelist.length > 0) score += 2;
  if (accessSettings.geoRestrictions.length > 0) score += 1;
  if (accessSettings.timeRestrictions.length > 0) score += 1;

  if (score >= 8) return "strict";
  if (score >= 6) return "high";
  if (score >= 3) return "medium";
  return "low";
}

export function mergeWithDefaultSettings(
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

export async function handleAutoSave(
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
