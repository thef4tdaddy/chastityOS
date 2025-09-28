import { useState, useCallback, useRef } from 'react';
import { doc, getDoc, setDoc, writeBatch, collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import * as Sentry from '@sentry/react';

/**
 * Data migration management hook with progress tracking and rollback capabilities
 * @param {string} userId - The user ID for migration operations
 * @param {boolean} isAuthReady - Whether authentication is ready
 * @returns {object} Migration state and management functions
 */
export const useMigration = (userId, isAuthReady) => {
  const [migrationStatus, setMigrationStatus] = useState({
    currentVersion: '0.0.0',
    targetVersion: '0.0.0',
    isRequired: false,
    inProgress: false,
    completed: false,
    failed: false,
    progress: 0,
    currentStep: '',
    totalSteps: 0,
    completedSteps: 0
  });

  const [migrationHistory, setMigrationHistory] = useState([]);
  const [rollbackAvailable, setRollbackAvailable] = useState(false);
  const [backupData, setBackupData] = useState(null);
  const [migrationLogs, setMigrationLogs] = useState([]);
  
  const migrationStepsRef = useRef([]);
  const abortControllerRef = useRef(null);

  // Migration step definitions
  const MIGRATION_STEPS = {
    '3.10.0': [
      {
        id: 'backup_existing_data',
        name: 'Backup Existing Data',
        description: 'Create backup of current user data',
        execute: async (userData) => {
          setBackupData(userData);
          return { success: true, data: userData };
        }
      },
      {
        id: 'update_settings_schema',
        name: 'Update Settings Schema',
        description: 'Migrate settings to new schema format',
        execute: async (userData) => {
          if (userData.settings) {
            const updatedSettings = {
              ...userData.settings,
              // Add new default settings for v3.10.0
              themeSettings: userData.settings.themeSettings || {
                currentTheme: { id: 'default', category: 'dark' },
                preferences: { autoTheme: false },
                accessibilitySettings: { highContrast: false, fontScale: 'normal' }
              }
            };
            return { success: true, data: { ...userData, settings: updatedSettings } };
          }
          return { success: true, data: userData };
        }
      }
    ],
    '4.0.0': [
      {
        id: 'backup_existing_data',
        name: 'Backup Existing Data',
        description: 'Create comprehensive backup of all user data',
        execute: async (userData) => {
          setBackupData(userData);
          return { success: true, data: userData };
        }
      },
      {
        id: 'migrate_gamification_data',
        name: 'Migrate Gamification Data',
        description: 'Initialize gamification system data',
        execute: async (userData) => {
          const gamificationData = {
            playerProfile: {
              level: 1,
              experience: 0,
              experienceToNext: 100,
              title: { id: 'newcomer', name: 'Newcomer' },
              badges: [],
              stats: { sessionsCompleted: 0, totalTimeInChastity: 0 }
            },
            activeChallenges: [],
            achievements: [],
            createdAt: new Date().toISOString()
          };
          
          return { 
            success: true, 
            data: { ...userData, gamificationData }
          };
        }
      },
      {
        id: 'initialize_performance_tracking',
        name: 'Initialize Performance Tracking',
        description: 'Set up performance monitoring data structures',
        execute: async (userData) => {
          const performanceData = {
            trackingEnabled: true,
            historicalMetrics: [],
            preferences: { autoOptimize: false, collectDetailedMetrics: true },
            createdAt: new Date().toISOString()
          };
          
          return { 
            success: true, 
            data: { ...userData, performanceData }
          };
        }
      }
    ]
  };

  // Add migration log entry
  const addLog = useCallback((level, message, data = null) => {
    const logEntry = {
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      level,
      message,
      data
    };
    
    setMigrationLogs(prev => [logEntry, ...prev.slice(0, 99)]); // Keep last 100 logs
    
    if (level === 'error') {
      console.error(`Migration Error: ${message}`, data);
      Sentry.addBreadcrumb({
        message: `Migration: ${message}`,
        level: 'error',
        category: 'migration',
        data
      });
    }
  }, []);

  // Get current user data version
  const getCurrentVersion = useCallback(async () => {
    if (!isAuthReady || !userId) return '0.0.0';
    
    try {
      const userDocRef = doc(db, 'users', userId);
      const docSnap = await getDoc(userDocRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return data.dataVersion || '3.9.0'; // Default to previous version
      }
      
      return '0.0.0';
    } catch (error) {
      addLog('error', 'Failed to get current version', error.message);
      return '0.0.0';
    }
  }, [isAuthReady, userId, addLog]);

  // Check if migration is required
  const checkMigrationRequired = useCallback(async (targetVersion = '4.0.0') => {
    const currentVersion = await getCurrentVersion();
    const isRequired = compareVersions(currentVersion, targetVersion) < 0;
    
    setMigrationStatus(prev => ({
      ...prev,
      currentVersion,
      targetVersion,
      isRequired
    }));
    
    return isRequired;
  }, [getCurrentVersion]);

  // Compare version strings
  const compareVersions = useCallback((version1, version2) => {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;
      
      if (v1Part < v2Part) return -1;
      if (v1Part > v2Part) return 1;
    }
    
    return 0;
  }, []);

  // Load user data for migration
  const loadUserData = useCallback(async () => {
    if (!isAuthReady || !userId) return null;
    
    try {
      const userDocRef = doc(db, 'users', userId);
      const docSnap = await getDoc(userDocRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const userData = docSnap.data();
      
      // Also load subcollections
      const eventsRef = collection(db, 'users', userId, 'events');
      const tasksRef = collection(db, 'users', userId, 'tasks');
      
      const [eventsSnapshot, tasksSnapshot] = await Promise.all([
        getDocs(eventsRef),
        getDocs(tasksRef)
      ]);
      
      const events = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      return {
        ...userData,
        events,
        tasks,
        userId
      };
    } catch (error) {
      addLog('error', 'Failed to load user data', error.message);
      throw error;
    }
  }, [isAuthReady, userId, addLog]);

  // Execute migration step
  const executeMigrationStep = useCallback(async (step, userData) => {
    addLog('info', `Executing step: ${step.name}`);
    
    try {
      const result = await step.execute(userData);
      
      if (result.success) {
        addLog('info', `Step completed: ${step.name}`);
        return result.data;
      } else {
        throw new Error(result.error || 'Step execution failed');
      }
    } catch (error) {
      addLog('error', `Step failed: ${step.name}`, error.message);
      throw error;
    }
  }, [addLog]);

  // Save migrated data
  const saveMigratedData = useCallback(async (migratedData, targetVersion) => {
    if (!isAuthReady || !userId) throw new Error('User not authenticated');
    
    try {
      const batch = writeBatch(db);
      const userDocRef = doc(db, 'users', userId);
      
      // Update main user document
      const mainData = { ...migratedData };
      delete mainData.events;
      delete mainData.tasks;
      mainData.dataVersion = targetVersion;
      mainData.lastMigration = new Date().toISOString();
      
      batch.set(userDocRef, mainData, { merge: true });
      
      // Note: For events and tasks, we would typically handle them separately
      // as they're in subcollections. This is a simplified version.
      
      await batch.commit();
      addLog('info', 'Migrated data saved successfully');
    } catch (error) {
      addLog('error', 'Failed to save migrated data', error.message);
      throw error;
    }
  }, [isAuthReady, userId, addLog]);

  // Run migration
  const runMigration = useCallback(async (targetVersion = '4.0.0') => {
    if (migrationStatus.inProgress) {
      addLog('warning', 'Migration already in progress');
      return;
    }
    
    try {
      setMigrationStatus(prev => ({
        ...prev,
        inProgress: true,
        failed: false,
        progress: 0,
        currentStep: 'Initializing...',
        totalSteps: 0,
        completedSteps: 0
      }));
      
      abortControllerRef.current = new AbortController();
      
      // Load current user data
      addLog('info', 'Loading user data for migration');
      const userData = await loadUserData();
      
      if (!userData) {
        throw new Error('No user data found to migrate');
      }
      
      // Get migration steps for target version
      const steps = MIGRATION_STEPS[targetVersion] || [];
      migrationStepsRef.current = steps;
      
      setMigrationStatus(prev => ({
        ...prev,
        totalSteps: steps.length,
        currentStep: 'Starting migration...'
      }));
      
      let migratedData = userData;
      
      // Execute each migration step
      for (let i = 0; i < steps.length; i++) {
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error('Migration aborted');
        }
        
        const step = steps[i];
        
        setMigrationStatus(prev => ({
          ...prev,
          currentStep: step.name,
          progress: Math.round((i / steps.length) * 100)
        }));
        
        migratedData = await executeMigrationStep(step, migratedData);
        
        setMigrationStatus(prev => ({
          ...prev,
          completedSteps: i + 1,
          progress: Math.round(((i + 1) / steps.length) * 100)
        }));
        
        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Save migrated data
      await saveMigratedData(migratedData, targetVersion);
      
      // Record migration in history
      const migrationRecord = {
        id: Date.now(),
        fromVersion: migrationStatus.currentVersion,
        toVersion: targetVersion,
        timestamp: new Date(),
        success: true,
        steps: steps.map(step => step.id)
      };
      
      setMigrationHistory(prev => [migrationRecord, ...prev.slice(0, 9)]); // Keep last 10
      setRollbackAvailable(true);
      
      setMigrationStatus(prev => ({
        ...prev,
        inProgress: false,
        completed: true,
        currentVersion: targetVersion,
        progress: 100,
        currentStep: 'Migration completed successfully'
      }));
      
      addLog('info', `Migration to ${targetVersion} completed successfully`);
      
    } catch (error) {
      setMigrationStatus(prev => ({
        ...prev,
        inProgress: false,
        failed: true,
        currentStep: `Migration failed: ${error.message}`
      }));
      
      addLog('error', 'Migration failed', error.message);
      Sentry.captureException(error);
      throw error;
    }
  }, [migrationStatus, loadUserData, executeMigrationStep, saveMigratedData, addLog]);

  // Abort migration
  const abortMigration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      addLog('warning', 'Migration aborted by user');
    }
    
    setMigrationStatus(prev => ({
      ...prev,
      inProgress: false,
      currentStep: 'Migration aborted'
    }));
  }, [addLog]);

  // Rollback migration
  const rollbackMigration = useCallback(async () => {
    if (!rollbackAvailable || !backupData) {
      throw new Error('No rollback data available');
    }
    
    try {
      addLog('info', 'Starting rollback operation');
      
      const userDocRef = doc(db, 'users', userId);
      await setDoc(userDocRef, backupData, { merge: true });
      
      setMigrationStatus(prev => ({
        ...prev,
        currentVersion: backupData.dataVersion || '3.9.0',
        completed: false,
        failed: false
      }));
      
      setRollbackAvailable(false);
      setBackupData(null);
      
      addLog('info', 'Rollback completed successfully');
      
    } catch (error) {
      addLog('error', 'Rollback failed', error.message);
      Sentry.captureException(error);
      throw error;
    }
  }, [rollbackAvailable, backupData, userId, addLog]);

  // Clear migration logs
  const clearLogs = useCallback(() => {
    setMigrationLogs([]);
  }, []);

  // Reset migration status
  const resetMigrationStatus = useCallback(() => {
    setMigrationStatus(prev => ({
      ...prev,
      inProgress: false,
      completed: false,
      failed: false,
      progress: 0,
      currentStep: '',
      completedSteps: 0
    }));
  }, []);

  return {
    // Status
    migrationStatus,
    migrationHistory,
    rollbackAvailable,
    migrationLogs,
    
    // Controls
    checkMigrationRequired,
    runMigration,
    abortMigration,
    rollbackMigration,
    resetMigrationStatus,
    
    // Utilities
    getCurrentVersion,
    clearLogs,
    
    // Computed values
    isMigrationRequired: migrationStatus.isRequired,
    isMigrationInProgress: migrationStatus.inProgress,
    migrationProgress: migrationStatus.progress,
    hasBackup: !!backupData,
    canRollback: rollbackAvailable && !!backupData
  };
};