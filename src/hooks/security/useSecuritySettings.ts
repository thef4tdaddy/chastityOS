/**
 * useSecuritySettings - Security Configuration Hook
 *
 * Manages comprehensive security settings including session timeouts,
 * IP restrictions, and security policies.
 */
import React, { useState, useEffect, useMemo } from "react";
import {
  SecuritySettingsState,
  SessionSecuritySettings,
  AccessControlSettings,
  MonitoringSettings,
  PrivacySecuritySettings,
  DeviceInfo,
  SecurityHealthCheck,
} from "../../types/security";
import {
  defaultSessionSettings,
  defaultAccessSettings,
  defaultMonitoringSettings,
  defaultPrivacySettings,
  fetchSecuritySettings,
  saveSecuritySettings,
  calculateSecurityScore,
  generateSecurityRecommendations,
  findSecurityIssues,
  calculateSecurityLevel,
  mergeWithDefaultSettings,
  handleAutoSave,
} from "../../utils/security/security-settings-utils";

interface UseSecuritySettingsOptions {
  userId: string;
  autoSave?: boolean;
  syncInterval?: number; // minutes
}

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
      err instanceof Error ? err.message : "Failed to load security settings",
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

// Helper to create a generic settings updater
function createGenericUpdater<T>(
  key: keyof SecuritySettingsState,
  params: {
    userId: string;
    autoSave: boolean;
    securityState: SecuritySettingsState;
    setSecurityState: React.Dispatch<
      React.SetStateAction<SecuritySettingsState>
    >;
    setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>;
  },
) {
  const {
    userId,
    autoSave,
    securityState,
    setSecurityState,
    setHasUnsavedChanges,
  } = params;

  return async (settings: Partial<T>): Promise<void> => {
    setSecurityState((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...settings },
    }));
    setHasUnsavedChanges(true);
    if (!autoSave) {
      await saveSecuritySettings(userId, {
        ...securityState,
        [key]: { ...securityState[key], ...settings },
      });
    }
  };
}

// Helper to create settings update callbacks
function createSettingsUpdateCallbacks(params: {
  userId: string;
  autoSave: boolean;
  securityState: SecuritySettingsState;
  setSecurityState: React.Dispatch<React.SetStateAction<SecuritySettingsState>>;
  setHasUnsavedChanges: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return {
    updateSessionSettings: createGenericUpdater<SessionSecuritySettings>(
      "sessionSettings",
      params,
    ),
    updateAccessSettings: createGenericUpdater<AccessControlSettings>(
      "accessSettings",
      params,
    ),
    updateMonitoringSettings: createGenericUpdater<MonitoringSettings>(
      "monitoringSettings",
      params,
    ),
    updatePrivacySettings: createGenericUpdater<PrivacySecuritySettings>(
      "privacySettings",
      params,
    ),
  };
}

// Helper to create security analysis functions
function createSecurityAnalysis(securityState: SecuritySettingsState) {
  const issues = findSecurityIssues(securityState);
  const securityLevel = calculateSecurityLevel(
    securityState.sessionSettings,
    securityState.accessSettings,
  );
  const recommendations = generateSecurityRecommendations(securityState);

  let status: SecurityHealthCheck["status"] = "healthy";
  if (issues.some((issue) => issue.severity === "critical")) {
    status = "critical";
  } else if (issues.some((issue) => issue.severity === "high")) {
    status = "critical";
  } else if (issues.some((issue) => issue.severity === "medium")) {
    status = "warning";
  }

  return {
    getSecurityScore: () => calculateSecurityScore(securityState),
    getSecurityRecommendations: () => recommendations,
    checkSecurityHealth: (): SecurityHealthCheck => ({
      status,
      issues,
      lastCheck: new Date(),
      nextCheck: new Date(Date.now() + 24 * 60 * 60 * 1000),
    }),
    isSecure: securityLevel >= "medium",
    needsAttention: recommendations.some((r) => r.priority === "high"),
    sessionTimeoutMinutes: securityState.sessionSettings.sessionTimeout,
    hasStrictSecurity: securityLevel === "strict",
  };
}

export const useSecuritySettings = (options: UseSecuritySettingsOptions) => {
  const { userId, autoSave = true } = options;
  const [securityState, setSecurityState] = useState(initialSecurityState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  useEffect(() => {
    if (userId) {
      loadSecuritySettings(userId, setSecurityState, setError, setLoading);
    }
  }, [userId]);
  useEffect(() => {
    if (autoSave && hasUnsavedChanges && !loading) {
      const saveTimer = setTimeout(() => {
        handleAutoSave(userId, securityState, setHasUnsavedChanges, setError);
      }, 2000);
      return () => clearTimeout(saveTimer);
    }
  }, [hasUnsavedChanges, autoSave, loading, userId, securityState]);
  const {
    updateSessionSettings,
    updateAccessSettings,
    updateMonitoringSettings,
    updatePrivacySettings,
  } = useMemo(
    () =>
      createSettingsUpdateCallbacks({
        userId,
        autoSave,
        securityState,
        setSecurityState,
        setHasUnsavedChanges,
      }),
    [userId, autoSave, securityState],
  );

  const actions = useMemo(
    () => ({
      setSessionTimeout: async (minutes: number) => {
        if (minutes < 5 || minutes > 480) {
          throw new Error(
            "Session timeout must be between 5 minutes and 8 hours",
          );
        }
        await updateSessionSettings({ sessionTimeout: minutes });
      },
      enableReauthRequirement: async (enabled: boolean) =>
        updateSessionSettings({ requireReauthForSensitive: enabled }),
      addTrustedDevice: async (device: DeviceInfo) =>
        updateAccessSettings({
          trustedDevices: [
            ...securityState.accessSettings.trustedDevices,
            device,
          ],
        }),
      removeTrustedDevice: async (deviceId: string) =>
        updateAccessSettings({
          trustedDevices: securityState.accessSettings.trustedDevices.filter(
            (device) => device.id !== deviceId,
          ),
        }),
      enableSecurityAlerts: async (enabled: boolean) =>
        updateMonitoringSettings({ enableSecurityAlerts: enabled }),
    }),
    [
      updateSessionSettings,
      updateAccessSettings,
      updateMonitoringSettings,
      securityState.accessSettings.trustedDevices,
    ],
  );
  const security = useMemo(
    () => createSecurityAnalysis(securityState),
    [securityState],
  );

  return {
    sessionSettings: securityState.sessionSettings,
    accessSettings: securityState.accessSettings,
    monitoringSettings: securityState.monitoringSettings,
    privacySettings: securityState.privacySettings,
    loading,
    error,
    hasUnsavedChanges,
    updateSessionSettings,
    updateAccessSettings,
    updateMonitoringSettings,
    updatePrivacySettings,
    ...actions,
    ...security,
  };
};
