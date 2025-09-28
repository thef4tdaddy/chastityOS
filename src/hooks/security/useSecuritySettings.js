import { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { logEvent } from '../../utils/logging';

// Default security settings
const DEFAULT_SESSION_SETTINGS = {
  sessionTimeout: 30, // minutes
  adminSessionTimeout: 15, // minutes
  requireReauthForSensitive: true,
  logoutOnBrowserClose: false,
  allowConcurrentSessions: false,
  maxConcurrentSessions: 1
};

const DEFAULT_ACCESS_SETTINGS = {
  trustedDevices: [],
  ipWhitelist: [],
  requireTwoFactor: false,
  allowedCountries: [],
  blockVPN: false,
  requireDeviceRegistration: false
};

const DEFAULT_MONITORING_SETTINGS = {
  enableSecurityAlerts: true,
  alertOnNewDevice: true,
  alertOnLocationChange: true,
  alertOnPermissionChange: true,
  alertOnDataExport: true,
  alertEmail: null,
  alertThreshold: 'medium'
};

const DEFAULT_PRIVACY_SETTINGS = {
  shareActivityWithKeyholder: false,
  shareLocationData: false,
  shareDeviceInfo: false,
  dataRetentionDays: 365,
  allowAnalytics: true
};

// Security levels
export const SecurityLevel = {
  BASIC: 'basic',
  MEDIUM: 'medium',
  STRICT: 'strict'
};

export const useSecuritySettings = (userId) => {
  const [sessionSettings, setSessionSettings] = useState(DEFAULT_SESSION_SETTINGS);
  const [accessSettings, setAccessSettings] = useState(DEFAULT_ACCESS_SETTINGS);
  const [monitoringSettings, setMonitoringSettings] = useState(DEFAULT_MONITORING_SETTINGS);
  const [privacySettings, setPrivacySettings] = useState(DEFAULT_PRIVACY_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch security settings from Firestore
  const fetchSecuritySettings = useCallback(async () => {
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
        const securityData = userData.securitySettings || {};
        
        setSessionSettings({ ...DEFAULT_SESSION_SETTINGS, ...securityData.session });
        setAccessSettings({ ...DEFAULT_ACCESS_SETTINGS, ...securityData.access });
        setMonitoringSettings({ ...DEFAULT_MONITORING_SETTINGS, ...securityData.monitoring });
        setPrivacySettings({ ...DEFAULT_PRIVACY_SETTINGS, ...securityData.privacy });
        setLastUpdated(securityData.lastUpdated?.toDate() || null);
      } else {
        // Initialize with defaults
        await initializeSecuritySettings();
      }
    } catch (error) {
      console.error('Error fetching security settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Initialize security settings for new user
  const initializeSecuritySettings = useCallback(async () => {
    if (!userId) return;

    try {
      const userDocRef = doc(db, 'users', userId);
      const securitySettings = {
        session: DEFAULT_SESSION_SETTINGS,
        access: DEFAULT_ACCESS_SETTINGS,
        monitoring: DEFAULT_MONITORING_SETTINGS,
        privacy: DEFAULT_PRIVACY_SETTINGS,
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      };

      await updateDoc(userDocRef, { securitySettings }, { merge: true });
      
      // Log initialization
      await logEvent(userId, 'SECURITY_SETTINGS_INIT', {
        action: 'initialize_security_settings'
      });
    } catch (error) {
      console.error('Error initializing security settings:', error);
    }
  }, [userId]);

  // Load settings on mount
  useEffect(() => {
    fetchSecuritySettings();
  }, [fetchSecuritySettings]);

  // Update session settings
  const updateSessionSettings = useCallback(async (newSettings) => {
    if (!userId) return;

    try {
      const updatedSettings = { ...sessionSettings, ...newSettings };
      const userDocRef = doc(db, 'users', userId);
      
      await updateDoc(userDocRef, {
        'securitySettings.session': updatedSettings,
        'securitySettings.lastUpdated': serverTimestamp()
      });

      setSessionSettings(updatedSettings);
      setLastUpdated(new Date());

      // Log the change
      await logEvent(userId, 'SECURITY_SETTINGS_UPDATE', {
        settingsType: 'session',
        changes: newSettings
      });
    } catch (error) {
      console.error('Error updating session settings:', error);
    }
  }, [userId, sessionSettings]);

  // Set session timeout
  const setSessionTimeout = useCallback(async (minutes) => {
    await updateSessionSettings({ sessionTimeout: minutes });
  }, [updateSessionSettings]);

  // Enable/disable reauthentication requirement
  const enableReauthRequirement = useCallback(async (enabled) => {
    await updateSessionSettings({ requireReauthForSensitive: enabled });
  }, [updateSessionSettings]);

  // Update access control settings
  const updateAccessSettings = useCallback(async (newSettings) => {
    if (!userId) return;

    try {
      const updatedSettings = { ...accessSettings, ...newSettings };
      const userDocRef = doc(db, 'users', userId);
      
      await updateDoc(userDocRef, {
        'securitySettings.access': updatedSettings,
        'securitySettings.lastUpdated': serverTimestamp()
      });

      setAccessSettings(updatedSettings);
      setLastUpdated(new Date());

      // Log the change
      await logEvent(userId, 'SECURITY_SETTINGS_UPDATE', {
        settingsType: 'access',
        changes: newSettings
      });
    } catch (error) {
      console.error('Error updating access settings:', error);
    }
  }, [userId, accessSettings]);

  // Add trusted device
  const addTrustedDevice = useCallback(async (deviceInfo) => {
    const trustedDevice = {
      id: Date.now().toString(),
      name: deviceInfo.name,
      userAgent: deviceInfo.userAgent,
      fingerprint: deviceInfo.fingerprint,
      addedAt: new Date(),
      lastUsed: new Date(),
      isActive: true
    };

    const updatedDevices = [...accessSettings.trustedDevices, trustedDevice];
    await updateAccessSettings({ trustedDevices: updatedDevices });

    // Log device addition
    await logEvent(userId, 'TRUSTED_DEVICE_ADD', {
      deviceId: trustedDevice.id,
      deviceName: trustedDevice.name
    });

    return trustedDevice;
  }, [accessSettings, updateAccessSettings, userId]);

  // Remove trusted device
  const removeTrustedDevice = useCallback(async (deviceId) => {
    const updatedDevices = accessSettings.trustedDevices.filter(
      device => device.id !== deviceId
    );
    await updateAccessSettings({ trustedDevices: updatedDevices });

    // Log device removal
    await logEvent(userId, 'TRUSTED_DEVICE_REMOVE', {
      deviceId
    });
  }, [accessSettings, updateAccessSettings, userId]);

  // Update monitoring settings
  const updateMonitoringSettings = useCallback(async (newSettings) => {
    if (!userId) return;

    try {
      const updatedSettings = { ...monitoringSettings, ...newSettings };
      const userDocRef = doc(db, 'users', userId);
      
      await updateDoc(userDocRef, {
        'securitySettings.monitoring': updatedSettings,
        'securitySettings.lastUpdated': serverTimestamp()
      });

      setMonitoringSettings(updatedSettings);
      setLastUpdated(new Date());

      // Log the change
      await logEvent(userId, 'SECURITY_SETTINGS_UPDATE', {
        settingsType: 'monitoring',
        changes: newSettings
      });
    } catch (error) {
      console.error('Error updating monitoring settings:', error);
    }
  }, [userId, monitoringSettings]);

  // Enable/disable security alerts
  const enableSecurityAlerts = useCallback(async (enabled) => {
    await updateMonitoringSettings({ enableSecurityAlerts: enabled });
  }, [updateMonitoringSettings]);

  // Update privacy settings
  const updatePrivacySettings = useCallback(async (newSettings) => {
    if (!userId) return;

    try {
      const updatedSettings = { ...privacySettings, ...newSettings };
      const userDocRef = doc(db, 'users', userId);
      
      await updateDoc(userDocRef, {
        'securitySettings.privacy': updatedSettings,
        'securitySettings.lastUpdated': serverTimestamp()
      });

      setPrivacySettings(updatedSettings);
      setLastUpdated(new Date());

      // Log the change
      await logEvent(userId, 'SECURITY_SETTINGS_UPDATE', {
        settingsType: 'privacy',
        changes: newSettings
      });
    } catch (error) {
      console.error('Error updating privacy settings:', error);
    }
  }, [userId, privacySettings]);

  // Calculate security level
  const calculateSecurityLevel = useCallback((sessionSettings, accessSettings) => {
    let score = 0;

    // Session security scoring
    if (sessionSettings.sessionTimeout <= 15) score += 2;
    else if (sessionSettings.sessionTimeout <= 30) score += 1;
    
    if (sessionSettings.requireReauthForSensitive) score += 2;
    if (!sessionSettings.allowConcurrentSessions) score += 1;
    if (sessionSettings.logoutOnBrowserClose) score += 1;

    // Access control scoring
    if (accessSettings.requireTwoFactor) score += 3;
    if (accessSettings.trustedDevices?.length > 0) score += 1;
    if (accessSettings.ipWhitelist?.length > 0) score += 2;
    if (accessSettings.requireDeviceRegistration) score += 2;
    if (accessSettings.blockVPN) score += 1;

    // Determine level based on score
    if (score >= 8) return SecurityLevel.STRICT;
    if (score >= 4) return SecurityLevel.MEDIUM;
    return SecurityLevel.BASIC;
  }, []);

  // Get security score (0-100)
  const getSecurityScore = useCallback(() => {
    let score = 0;
    let maxScore = 0;

    // Session security (40 points max)
    maxScore += 40;
    if (sessionSettings.sessionTimeout <= 15) score += 15;
    else if (sessionSettings.sessionTimeout <= 30) score += 10;
    else if (sessionSettings.sessionTimeout <= 60) score += 5;
    
    if (sessionSettings.requireReauthForSensitive) score += 10;
    if (!sessionSettings.allowConcurrentSessions) score += 8;
    if (sessionSettings.logoutOnBrowserClose) score += 7;

    // Access control (40 points max)
    maxScore += 40;
    if (accessSettings.requireTwoFactor) score += 20;
    if (accessSettings.trustedDevices?.length > 0) score += 5;
    if (accessSettings.ipWhitelist?.length > 0) score += 10;
    if (accessSettings.requireDeviceRegistration) score += 3;
    if (accessSettings.blockVPN) score += 2;

    // Monitoring (20 points max)
    maxScore += 20;
    if (monitoringSettings.enableSecurityAlerts) score += 5;
    if (monitoringSettings.alertOnNewDevice) score += 5;
    if (monitoringSettings.alertOnLocationChange) score += 5;
    if (monitoringSettings.alertOnPermissionChange) score += 5;

    return Math.round((score / maxScore) * 100);
  }, [sessionSettings, accessSettings, monitoringSettings]);

  // Get security recommendations
  const getSecurityRecommendations = useCallback(() => {
    const recommendations = [];

    // Session recommendations
    if (sessionSettings.sessionTimeout > 60) {
      recommendations.push({
        priority: 'high',
        category: 'session',
        title: 'Reduce Session Timeout',
        description: 'Consider reducing your session timeout to 30 minutes or less for better security.',
        action: 'reduce_timeout'
      });
    }

    if (!sessionSettings.requireReauthForSensitive) {
      recommendations.push({
        priority: 'medium',
        category: 'session',
        title: 'Enable Re-authentication',
        description: 'Require re-authentication for sensitive actions to prevent unauthorized access.',
        action: 'enable_reauth'
      });
    }

    // Access control recommendations
    if (!accessSettings.requireTwoFactor) {
      recommendations.push({
        priority: 'high',
        category: 'access',
        title: 'Enable Two-Factor Authentication',
        description: 'Two-factor authentication significantly improves account security.',
        action: 'enable_2fa'
      });
    }

    if (accessSettings.trustedDevices.length === 0) {
      recommendations.push({
        priority: 'low',
        category: 'access',
        title: 'Add Trusted Devices',
        description: 'Register your frequently used devices as trusted to improve security monitoring.',
        action: 'add_trusted_device'
      });
    }

    // Monitoring recommendations
    if (!monitoringSettings.enableSecurityAlerts) {
      recommendations.push({
        priority: 'medium',
        category: 'monitoring',
        title: 'Enable Security Alerts',
        description: 'Get notified about important security events on your account.',
        action: 'enable_alerts'
      });
    }

    return recommendations;
  }, [sessionSettings, accessSettings, monitoringSettings]);

  // Check security health
  const checkSecurityHealth = useCallback(() => {
    const score = getSecurityScore();
    const recommendations = getSecurityRecommendations();
    const highPriorityIssues = recommendations.filter(r => r.priority === 'high').length;
    
    let status = 'good';
    if (score < 40 || highPriorityIssues > 2) status = 'poor';
    else if (score < 70 || highPriorityIssues > 0) status = 'fair';

    return {
      score,
      status,
      recommendations,
      highPriorityIssues,
      lastChecked: new Date(),
      summary: {
        sessionSecurity: sessionSettings.requireReauthForSensitive && sessionSettings.sessionTimeout <= 30,
        accessControl: accessSettings.requireTwoFactor,
        monitoring: monitoringSettings.enableSecurityAlerts
      }
    };
  }, [getSecurityScore, getSecurityRecommendations, sessionSettings, accessSettings, monitoringSettings]);

  // Computed values
  const securityLevel = useMemo(() => {
    return calculateSecurityLevel(sessionSettings, accessSettings);
  }, [sessionSettings, accessSettings, calculateSecurityLevel]);

  const isSecure = useMemo(() => {
    return securityLevel === SecurityLevel.MEDIUM || securityLevel === SecurityLevel.STRICT;
  }, [securityLevel]);

  const needsAttention = useMemo(() => {
    const recommendations = getSecurityRecommendations();
    return recommendations.some(r => r.priority === 'high');
  }, [getSecurityRecommendations]);

  const sessionTimeoutMinutes = sessionSettings.sessionTimeout;

  const hasStrictSecurity = securityLevel === SecurityLevel.STRICT;

  return {
    // Settings state
    sessionSettings,
    accessSettings,
    monitoringSettings,
    privacySettings,
    isLoading,
    lastUpdated,

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
    isSecure,
    needsAttention,
    sessionTimeoutMinutes,
    hasStrictSecurity,
    securityLevel
  };
};