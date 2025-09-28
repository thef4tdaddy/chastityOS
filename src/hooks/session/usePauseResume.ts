/**
 * Enhanced Pause/Resume System Hook
 * 
 * Enhanced version of pause functionality with keyholder overrides,
 * advanced cooldown management, and comprehensive pause tracking.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  PauseStatus,
  CooldownState,
  CooldownReason
} from '../../types';

// Enhanced pause state interface
export interface EnhancedPauseState {
  // Current pause status
  pauseStatus: PauseStatus;
  
  // Cooldown system
  cooldownState: CooldownState;
  
  // Keyholder overrides
  keyholderOverrides: KeyholderOverrideCapabilities;
  
  // Pause history and analytics
  pauseHistory: PauseHistoryEntry[];
  pauseAnalytics: PauseAnalytics;
}

export interface KeyholderOverrideCapabilities {
  canOverrideCooldown: boolean;
  canForcePause: boolean;
  canForceResume: boolean;
  canModifyCooldownDuration: boolean;
  requiresReason: boolean;
}

export interface PauseHistoryEntry {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // seconds
  reason: string;
  requestedBy: 'user' | 'keyholder' | 'system';
  emergencyPause: boolean;
  overrideCooldown: boolean;
}

export interface PauseAnalytics {
  totalPauses: number;
  averagePauseDuration: number;
  pauseFrequency: number; // pauses per session
  cooldownEffectiveness: number; // percentage
  emergencyPauseCount: number;
  patterns: PausePattern[];
}

export interface PausePattern {
  timeOfDay: string;
  frequency: number;
  averageDuration: number;
  commonReasons: string[];
}

export type PauseReason = 'emergency' | 'comfort' | 'scheduled' | 'keyholder_requested' | 'system_maintenance';

export interface PauseRequestStatus {
  status: 'approved' | 'denied' | 'pending';
  reason?: string;
  approvedBy?: string;
  timestamp: Date;
}

export interface OverrideRequestStatus {
  status: 'approved' | 'denied' | 'pending' | 'expired';
  justification: string;
  reviewedBy?: string;
  expiresAt?: Date;
  timestamp?: Date;
}

/**
 * Enhanced Pause/Resume Hook
 * 
 * @param sessionId - Current session ID
 * @param relationshipId - Optional relationship ID for keyholder scenarios
 * @returns Enhanced pause/resume state and controls
 */
export const usePauseResume = (sessionId: string, relationshipId?: string) => {
  // State management
  const [pauseStatus, setPauseStatus] = useState<PauseStatus>({
    isPaused: false,
    requestedBy: 'user',
    emergencyPause: false
  });

  const [cooldownState, setCooldownState] = useState<CooldownState>({
    isInCooldown: false,
    cooldownRemaining: 0,
    nextPauseAvailable: null,
    cooldownReason: 'frequent_use',
    canOverride: false
  });

  const [keyholderOverrides, setKeyholderOverrides] = useState<KeyholderOverrideCapabilities>({
    canOverrideCooldown: false,
    canForcePause: false,
    canForceResume: false,
    canModifyCooldownDuration: false,
    requiresReason: true
  });

  const [pauseHistory, setPauseHistory] = useState<PauseHistoryEntry[]>([]);
  const [pauseAnalytics, setPauseAnalytics] = useState<PauseAnalytics>({
    totalPauses: 0,
    averagePauseDuration: 0,
    pauseFrequency: 0,
    cooldownEffectiveness: 0,
    emergencyPauseCount: 0,
    patterns: []
  });

  // Refs for timers
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize keyholder capabilities
  useEffect(() => {
    const initializeKeyholderCapabilities = async () => {
      if (relationshipId) {
        try {
          const capabilities = await loadKeyholderCapabilities(relationshipId);
          setKeyholderOverrides(capabilities);
        } catch (error) {
          console.error('Failed to load keyholder capabilities:', error);
        }
      }
    };

    initializeKeyholderCapabilities();
  }, [relationshipId]);

  // Load pause history and analytics
  useEffect(() => {
    const loadPauseData = async () => {
      try {
        const history = await loadPauseHistory(sessionId);
        const analytics = await calculatePauseAnalytics(history);
        
        setPauseHistory(history);
        setPauseAnalytics(analytics);
      } catch (error) {
        console.error('Failed to load pause data:', error);
      }
    };

    loadPauseData();
  }, [sessionId]);

  // Cooldown timer management
  useEffect(() => {
    if (cooldownState.isInCooldown && cooldownState.cooldownRemaining > 0) {
      cooldownTimerRef.current = setInterval(() => {
        setCooldownState(prev => {
          const newRemaining = prev.cooldownRemaining - 1;
          
          if (newRemaining <= 0) {
            return {
              ...prev,
              isInCooldown: false,
              cooldownRemaining: 0,
              nextPauseAvailable: null
            };
          }
          
          return {
            ...prev,
            cooldownRemaining: newRemaining
          };
        });
      }, 1000);
    } else {
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
        cooldownTimerRef.current = null;
      }
    }

    return () => {
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
      }
    };
  }, [cooldownState.isInCooldown, cooldownState.cooldownRemaining]);

  // Basic pause/resume actions
  const pauseSession = useCallback(async (reason: PauseReason): Promise<void> => {
    // Check if pause is allowed
    if (pauseStatus.isPaused) {
      throw new Error('Session is already paused');
    }

    if (cooldownState.isInCooldown && !keyholderOverrides.canOverrideCooldown) {
      throw new Error(`Cannot pause: in cooldown for ${cooldownState.cooldownRemaining} seconds`);
    }

    const isEmergency = reason === 'emergency';
    
    const newPauseStatus: PauseStatus = {
      isPaused: true,
      startTime: new Date(),
      reason: reason,
      requestedBy: 'user',
      emergencyPause: isEmergency
    };

    setPauseStatus(newPauseStatus);

    // Create pause history entry
    const historyEntry: PauseHistoryEntry = {
      id: generatePauseId(),
      startTime: new Date(),
      reason: reason,
      requestedBy: 'user',
      emergencyPause: isEmergency,
      overrideCooldown: cooldownState.isInCooldown
    };

    setPauseHistory(prev => [...prev, historyEntry]);
    
    // Save to storage
    await savePauseEvent(historyEntry);
    
    // Start pause timer if needed
    if (pauseTimerRef.current) {
      clearInterval(pauseTimerRef.current);
    }
    
    pauseTimerRef.current = setInterval(() => {
      setPauseStatus(prev => prev.isPaused ? {
        ...prev,
        // Calculate current pause duration for display
      } : prev);
    }, 1000);

  }, [pauseStatus.isPaused, cooldownState, keyholderOverrides.canOverrideCooldown]);

  const resumeSession = useCallback(async (): Promise<void> => {
    if (!pauseStatus.isPaused) {
      throw new Error('Session is not paused');
    }

    const endTime = new Date();
    const startTime = pauseStatus.startTime!;
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    // Update pause status
    setPauseStatus({
      isPaused: false,
      requestedBy: 'user',
      emergencyPause: false
    });

    // Update pause history
    setPauseHistory(prev => {
      const updated = [...prev];
      const lastEntry = updated[updated.length - 1];
      if (lastEntry && !lastEntry.endTime) {
        lastEntry.endTime = endTime;
        lastEntry.duration = duration;
      }
      return updated;
    });

    // Start cooldown if not emergency pause
    if (!pauseStatus.emergencyPause) {
      const cooldownDuration = calculateCooldownDuration(duration, pauseAnalytics);
      startCooldown(cooldownDuration, 'frequent_use');
    }

    // Clear pause timer
    if (pauseTimerRef.current) {
      clearInterval(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }

    // Save updated pause event
    await updatePauseEvent(pauseHistory[pauseHistory.length - 1]?.id, { endTime, duration });
    
  }, [pauseStatus, pauseAnalytics, pauseHistory]);

  // Enhanced actions
  const requestEmergencyPause = useCallback(async (reason: string): Promise<PauseRequestStatus> => {
    const request: PauseRequestStatus = {
      status: 'approved', // Emergency pauses are typically auto-approved
      reason,
      timestamp: new Date()
    };

    // Emergency pauses bypass cooldowns
    await pauseSession('emergency');
    
    return request;
  }, [pauseSession]);

  const requestCooldownOverride = useCallback(async (justification: string): Promise<OverrideRequestStatus> => {
    if (!relationshipId) {
      return {
        status: 'denied',
        justification,
        timestamp: new Date()
      };
    }

    // Submit request to keyholder
    const request = await submitOverrideRequest(relationshipId, justification);
    return request;
  }, [relationshipId]);

  // Keyholder actions (if authorized)
  const keyholderForcePause = useCallback(async (reason: string): Promise<void> => {
    if (!keyholderOverrides.canForcePause) {
      throw new Error('Keyholder does not have force pause permission');
    }

    const newPauseStatus: PauseStatus = {
      isPaused: true,
      startTime: new Date(),
      reason,
      requestedBy: 'keyholder',
      emergencyPause: false
    };

    setPauseStatus(newPauseStatus);

    // Create history entry
    const historyEntry: PauseHistoryEntry = {
      id: generatePauseId(),
      startTime: new Date(),
      reason,
      requestedBy: 'keyholder',
      emergencyPause: false,
      overrideCooldown: false
    };

    setPauseHistory(prev => [...prev, historyEntry]);
    await savePauseEvent(historyEntry);
  }, [keyholderOverrides.canForcePause]);

  const keyholderForceResume = useCallback(async (reason: string): Promise<void> => {
    if (!keyholderOverrides.canForceResume) {
      throw new Error('Keyholder does not have force resume permission');
    }

    await resumeSession();
    
    // Log the keyholder intervention
    await logKeyholderAction('force_resume', reason);
  }, [keyholderOverrides.canForceResume, resumeSession]);

  const keyholderOverrideCooldown = useCallback(async (reason: string): Promise<void> => {
    if (!keyholderOverrides.canOverrideCooldown) {
      throw new Error('Keyholder does not have cooldown override permission');
    }

    setCooldownState({
      isInCooldown: false,
      cooldownRemaining: 0,
      nextPauseAvailable: null,
      cooldownReason: 'keyholder_restriction',
      canOverride: false
    });

    await logKeyholderAction('override_cooldown', reason);
  }, [keyholderOverrides.canOverrideCooldown]);

  // Analytics methods
  const getPausePatterns = useCallback((): PausePattern[] => {
    return pauseAnalytics.patterns;
  }, [pauseAnalytics.patterns]);

  const getCooldownEffectiveness = useCallback((): number => {
    return pauseAnalytics.cooldownEffectiveness;
  }, [pauseAnalytics.cooldownEffectiveness]);

  // Helper functions
  const startCooldown = (duration: number, reason: CooldownReason) => {
    const nextAvailable = new Date(Date.now() + duration * 1000);
    
    setCooldownState({
      isInCooldown: true,
      cooldownRemaining: duration,
      nextPauseAvailable: nextAvailable,
      cooldownReason: reason,
      canOverride: keyholderOverrides.canOverrideCooldown
    });
  };

  // Computed properties
  const canPause = !pauseStatus.isPaused && !cooldownState.isInCooldown;
  const canResume = pauseStatus.isPaused;
  const timeUntilNextPause = cooldownState.nextPauseAvailable ? 
    Math.max(0, Math.floor((cooldownState.nextPauseAvailable.getTime() - Date.now()) / 1000)) : 0;
  const hasKeyholderOverride = keyholderOverrides.canOverrideCooldown;
  const pauseFrequency = calculatePauseFrequency(pauseHistory);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
      }
      if (pauseTimerRef.current) {
        clearInterval(pauseTimerRef.current);
      }
    };
  }, []);

  return {
    // Enhanced state
    pauseStatus,
    cooldownState,
    keyholderOverrides,
    pauseAnalytics,
    
    // Basic actions
    pauseSession,
    resumeSession,
    
    // Enhanced actions
    requestEmergencyPause,
    requestCooldownOverride,
    
    // Keyholder actions (if authorized)
    keyholderForcePause,
    keyholderForceResume,
    keyholderOverrideCooldown,
    
    // Analytics
    getPausePatterns,
    getCooldownEffectiveness,
    
    // Computed properties
    canPause,
    canResume,
    timeUntilNextPause,
    hasKeyholderOverride,
    pauseFrequency
  };
};

// Helper functions
function generatePauseId(): string {
  return `pause_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function loadKeyholderCapabilities(_relationshipId: string): Promise<KeyholderOverrideCapabilities> {
  // Mock implementation - would load from Firebase/API
  return {
    canOverrideCooldown: true,
    canForcePause: true,
    canForceResume: true,
    canModifyCooldownDuration: true,
    requiresReason: true
  };
}

async function loadPauseHistory(_sessionId: string): Promise<PauseHistoryEntry[]> {
  // Mock implementation - would load from storage
  return [];
}

async function calculatePauseAnalytics(history: PauseHistoryEntry[]): Promise<PauseAnalytics> {
  const totalPauses = history.length;
  const completedPauses = history.filter(p => p.duration !== undefined);
  const emergencyPauses = history.filter(p => p.emergencyPause);
  
  const averageDuration = completedPauses.length > 0 
    ? completedPauses.reduce((sum, p) => sum + (p.duration || 0), 0) / completedPauses.length
    : 0;

  return {
    totalPauses,
    averagePauseDuration: averageDuration,
    pauseFrequency: totalPauses > 0 ? totalPauses / 7 : 0, // per week
    cooldownEffectiveness: 85, // Would be calculated based on actual data
    emergencyPauseCount: emergencyPauses.length,
    patterns: [] // Would analyze patterns in pause timing
  };
}

async function savePauseEvent(_entry: PauseHistoryEntry): Promise<void> {
  // Mock implementation - would save to Firebase/storage
  console.log('Saving pause event');
}

async function updatePauseEvent(_entryId: string, _updates: Partial<PauseHistoryEntry>): Promise<void> {
  // Mock implementation - would update in Firebase/storage
  console.log('Updating pause event');
}

async function submitOverrideRequest(_relationshipId: string, justification: string): Promise<OverrideRequestStatus> {
  // Mock implementation - would submit to keyholder for review
  return {
    status: 'pending',
    justification,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  };
}

async function logKeyholderAction(_action: string, _reason: string): Promise<void> {
  // Mock implementation - would log keyholder actions
  console.log('Logging keyholder action');
}

function calculateCooldownDuration(pauseDuration: number, analytics: PauseAnalytics): number {
  // Smart cooldown calculation based on pause duration and user patterns
  const baseCooldown = Math.min(pauseDuration * 2, 300); // Max 5 minutes
  const frequencyAdjustment = analytics.pauseFrequency > 3 ? 60 : 0; // Add 1 minute if frequent
  
  return baseCooldown + frequencyAdjustment;
}

function calculatePauseFrequency(history: PauseHistoryEntry[]): number {
  // Calculate pauses per session or per day
  const recentHistory = history.filter(p => {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return p.startTime > dayAgo;
  });
  
  return recentHistory.length;
}