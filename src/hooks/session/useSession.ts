/**
 * Enhanced Session Management Hook
 * 
 * Enhanced version of useChastitySession that supports multi-user scenarios,
 * keyholder controls, and advanced session management features.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  SessionState, 
  SessionContext, 
  SessionPermission,
  KeyholderInfo,
  SessionGoal,
  SessionAnalytics,
  ModificationRequest,
  ApprovalStatus
} from '../../types';

// Enhanced session state interface
export interface EnhancedSessionState {
  // Current session
  currentSession: SessionState | null;
  
  // Session context
  sessionContext: SessionContext;
  
  // Keyholder integration
  keyholderControls: KeyholderSessionControls | null;
  
  // Enhanced features
  goals: SessionGoal[];
  analytics: SessionAnalytics;
}

export interface KeyholderSessionControls {
  canModify: boolean;
  canOverride: boolean;
  activeKeyholder: KeyholderInfo;
  controlHistory: ControlAction[];
}

export interface ControlAction {
  id: string;
  type: 'start' | 'stop' | 'modify' | 'override';
  performedBy: string;
  timestamp: Date;
  reason?: string;
  details?: any;
}

export interface SessionModifications {
  goals?: string[];
  endTime?: Date;
  notes?: string;
  permissions?: SessionPermission[];
}

export interface SessionInsights {
  averageDuration: number;
  completionTrend: number;
  goalEffectiveness: number;
  satisfactionScore: number;
  recommendations: string[];
}

export interface PredictiveAnalytics {
  predictedDuration: number;
  successProbability: number;
  riskFactors: string[];
  suggestedGoals: SessionGoal[];
}

/**
 * Enhanced Session Management Hook
 * 
 * @param userId - User ID for the session
 * @param relationshipId - Optional relationship ID for keyholder scenarios
 * @returns Enhanced session state and controls
 */
export const useSession = (userId: string, relationshipId?: string) => {
  // State management
  const [currentSession, setCurrentSession] = useState<SessionState | null>(null);
  const [sessionContext, setSessionContext] = useState<SessionContext>({
    userId,
    relationshipId,
    sessionType: relationshipId ? 'keyholder_managed' : 'self_managed',
    permissions: ['self_modify', 'emergency_pause', 'set_goals', 'view_analytics']
  });
  const [keyholderControls, setKeyholderControls] = useState<KeyholderSessionControls | null>(null);
  const [goals, setGoals] = useState<SessionGoal[]>([]);
  const [analytics] = useState<SessionAnalytics>({
    totalSessions: 0,
    averageDuration: 0,
    completionRate: 0,
    goalAchievementRate: 0,
    trends: []
  });

  // Refs for timers
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const analyticsTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize session context based on relationship
  useEffect(() => {
    const initializeContext = async () => {
      if (relationshipId) {
        // Load keyholder information and permissions
        try {
          // This would typically load from Firebase/API
          const keyholderInfo = await loadKeyholderInfo(relationshipId);
          const permissions = await loadRelationshipPermissions(relationshipId);
          
          setSessionContext({
            userId,
            relationshipId,
            sessionType: 'keyholder_managed',
            permissions
          });

          setKeyholderControls({
            canModify: permissions.includes('modify_session'),
            canOverride: permissions.includes('override_cooldown'),
            activeKeyholder: keyholderInfo,
            controlHistory: []
          });
        } catch (error) {
          console.error('Failed to initialize keyholder context:', error);
          // Fall back to self-managed
          setSessionContext({
            userId,
            sessionType: 'self_managed',
            permissions: ['self_modify', 'emergency_pause', 'set_goals', 'view_analytics']
          });
        }
      }
    };

    initializeContext();
  }, [userId, relationshipId]);

  // Session lifecycle methods
  const startSession = useCallback(async (sessionGoals?: SessionGoal[]): Promise<SessionState> => {
    if (currentSession?.isActive) {
      throw new Error('Session already active');
    }

    const newSession: SessionState = {
      id: generateSessionId(),
      userId,
      isActive: true,
      startTime: new Date(),
      duration: 0,
      effectiveDuration: 0,
      pauseTime: 0,
      goals: sessionGoals?.map(g => g.id) || [],
      type: sessionContext.sessionType,
      status: 'active'
    };

    setCurrentSession(newSession);
    
    if (sessionGoals) {
      setGoals(sessionGoals);
    }

    // Start session timer
    sessionTimerRef.current = setInterval(() => {
      setCurrentSession(prev => prev ? {
        ...prev,
        duration: Math.floor((Date.now() - prev.startTime.getTime()) / 1000)
      } : null);
    }, 1000);

    // Save to persistence layer
    await saveSessionToStorage(newSession);
    
    return newSession;
  }, [currentSession, userId, sessionContext.sessionType]);

  const stopSession = useCallback(async (_reason?: string): Promise<void> => {
    if (!currentSession?.isActive) {
      throw new Error('No active session to stop');
    }

    const endTime = new Date();
    const finalSession: SessionState = {
      ...currentSession,
      isActive: false,
      endTime,
      status: 'completed'
    };

    setCurrentSession(finalSession);

    // Clear timer
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }

    // Save final session state
    await saveSessionToStorage(finalSession);
    
    // Update analytics
    await updateAnalytics(finalSession);
  }, [currentSession]);

  const modifySession = useCallback(async (modifications: SessionModifications): Promise<void> => {
    if (!currentSession) {
      throw new Error('No active session to modify');
    }

    // Check permissions
    const canSelfModify = sessionContext.permissions.includes('self_modify');
    const hasKeyholderControl = keyholderControls?.canModify;

    if (!canSelfModify && !hasKeyholderControl) {
      throw new Error('Insufficient permissions to modify session');
    }

    // Apply modifications
    const updatedSession = { ...currentSession };
    
    if (modifications.goals) {
      updatedSession.goals = modifications.goals;
    }
    
    if (modifications.endTime) {
      updatedSession.endTime = modifications.endTime;
    }

    setCurrentSession(updatedSession);
    await saveSessionToStorage(updatedSession);
  }, [currentSession, sessionContext.permissions, keyholderControls]);

  const requestModification = useCallback(async (request: ModificationRequest): Promise<void> => {
    if (!relationshipId) {
      throw new Error('No keyholder relationship available for requests');
    }

    // Save modification request for keyholder review
    await saveModificationRequest(request);
  }, [relationshipId]);

  const requestKeyholderApproval = useCallback(async (_action: string): Promise<ApprovalStatus> => {
    if (!keyholderControls) {
      return 'rejected';
    }

    // This would typically send a request to the keyholder
    // For now, return pending status
    return 'pending';
  }, [keyholderControls]);

  // Analytics methods
  const getSessionInsights = useCallback((): SessionInsights => {
    return {
      averageDuration: analytics.averageDuration,
      completionTrend: calculateCompletionTrend(analytics.trends),
      goalEffectiveness: analytics.goalAchievementRate,
      satisfactionScore: 85, // This would be calculated from user feedback
      recommendations: generateRecommendations(analytics, goals)
    };
  }, [analytics, goals]);

  const getPredictiveAnalytics = useCallback((): PredictiveAnalytics => {
    return {
      predictedDuration: analytics.averageDuration * 1.1, // Simple prediction
      successProbability: analytics.completionRate,
      riskFactors: identifyRiskFactors(goals, analytics),
      suggestedGoals: generateGoalSuggestions(analytics)
    };
  }, [analytics, goals]);

  // Computed properties
  const isActive = currentSession?.isActive ?? false;
  const duration = currentSession?.duration ?? 0;
  const goalProgress = calculateGoalProgress(currentSession, goals);
  const isUnderKeyholderControl = !!relationshipId && !!keyholderControls;
  const canSelfModify = sessionContext.permissions.includes('self_modify') && 
                       (!keyholderControls?.canModify || keyholderControls.canModify);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
      if (analyticsTimerRef.current) {
        clearInterval(analyticsTimerRef.current);
      }
    };
  }, []);

  return {
    // Enhanced state
    session: currentSession,
    context: sessionContext,
    keyholderControls,
    goals,
    analytics,
    
    // Session lifecycle
    startSession,
    stopSession,
    
    // Enhanced controls
    modifySession,
    requestModification,
    
    // Keyholder integration
    requestKeyholderApproval,
    
    // Analytics and insights
    getSessionInsights,
    getPredictiveAnalytics,
    
    // Computed properties
    isActive,
    duration,
    goalProgress,
    isUnderKeyholderControl,
    canSelfModify
  };
};

// Helper functions (these would typically be in separate utility files)
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function loadKeyholderInfo(_relationshipId: string): Promise<KeyholderInfo> {
  // Mock implementation - would load from Firebase/API
  return {
    id: 'keyholder_id',
    name: 'Keyholder',
    permissions: ['modify_session', 'override_cooldown', 'force_pause', 'force_resume'],
    relationshipStartDate: new Date()
  };
}

async function loadRelationshipPermissions(_relationshipId: string): Promise<SessionPermission[]> {
  // Mock implementation - would load from Firebase/API
  return ['emergency_pause', 'view_analytics'];
}

async function saveSessionToStorage(session: SessionState): Promise<void> {
  // Mock implementation - would save to Firebase/local storage
  console.log('Saving session:', session);
}

async function updateAnalytics(session: SessionState): Promise<void> {
  // Mock implementation - would update analytics in storage
  console.log('Updating analytics for session:', session);
}

async function saveModificationRequest(request: ModificationRequest): Promise<void> {
  // Mock implementation - would save request for keyholder review
  console.log('Saving modification request:', request);
}

function calculateCompletionTrend(trends: any[]): number {
  // Simple trend calculation
  return trends.length > 0 ? trends[trends.length - 1].change : 0;
}

function generateRecommendations(analytics: SessionAnalytics, _goals: SessionGoal[]): string[] {
  const recommendations: string[] = [];
  
  if (analytics.completionRate < 0.7) {
    recommendations.push('Consider setting more achievable goals');
  }
  
  if (analytics.goalAchievementRate < 0.5) {
    recommendations.push('Focus on fewer, high-priority goals');
  }
  
  return recommendations;
}

function calculateGoalProgress(session: SessionState | null, goals: SessionGoal[]): number {
  if (!session || goals.length === 0) return 0;
  
  const completedGoals = goals.filter(g => g.progress >= 100).length;
  return (completedGoals / goals.length) * 100;
}

function identifyRiskFactors(goals: SessionGoal[], analytics: SessionAnalytics): string[] {
  const riskFactors: string[] = [];
  
  if (goals.length > 5) {
    riskFactors.push('Too many active goals');
  }
  
  if (analytics.completionRate < 0.5) {
    riskFactors.push('Low historical completion rate');
  }
  
  return riskFactors;
}

function generateGoalSuggestions(_analytics: SessionAnalytics): SessionGoal[] {
  // Mock implementation - would generate intelligent goal suggestions
  return [];
}