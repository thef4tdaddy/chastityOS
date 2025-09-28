import { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, collection, query, where, onSnapshot, addDoc, updateDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase';

// Import types from other hooks
import { KeyholderRelationship, SessionGoals } from './useKeyholderSystem';

// Types and Interfaces
export interface MultiWearerStats {
  totalRelationships: number;
  activeRelationships: number;
  totalActiveSessions: number;
  totalEffectiveTime: number;
  averageSessionLength: number;
  recentActivity: number;
}

export interface ComparativeStats {
  relationships: RelationshipComparison[];
  aggregates: {
    totalTime: number;
    averageCompliance: number;
    mostActive: string;
    needingAttention: string[];
  };
}

export interface RelationshipComparison {
  relationshipId: string;
  submissiveName: string;
  totalSessionTime: number;
  sessionsCompleted: number;
  complianceRate: number;
  lastActiveDate: Date;
  currentStreak: number;
  needsAttention: boolean;
}

export interface BulkOperation {
  type: 'start_sessions' | 'stop_sessions' | 'assign_tasks' | 'send_rewards' | 'send_message';
  targetIds: string[];
  parameters: any;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  errors: string[];
}

export interface BulkOperationStatus {
  id: string;
  operation: BulkOperation;
  results: BulkOperationResult[];
}

export interface BulkOperationResult {
  relationshipId: string;
  success: boolean;
  error?: string;
  data?: any;
}

export interface TaskTemplate {
  title: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  deadline?: Date;
  rewards?: any;
  punishments?: any;
}

export interface RewardAction {
  id: string;
  name: string;
  type: string;
  impact: any;
}

export interface MultiWearerState {
  relationships: KeyholderRelationship[];
  activeRelationship: KeyholderRelationship | null;
  bulkOperations: BulkOperationStatus[];
  overviewStats: MultiWearerStats;
}

export interface MultiWearerActions {
  switchToRelationship: (relationshipId: string) => void;
  startBulkOperation: (operation: Omit<BulkOperation, 'status' | 'progress' | 'startedAt' | 'errors'>) => Promise<BulkOperationStatus>;
  sendBroadcastMessage: (message: string, recipients: string[]) => Promise<void>;
  getComparativeStats: (relationshipIds: string[]) => Promise<ComparativeStats>;
}

export const useMultiWearer = (keyholderId: string) => {
  // State
  const [relationships, setRelationships] = useState<KeyholderRelationship[]>([]);
  const [activeRelationship, setActiveRelationship] = useState<KeyholderRelationship | null>(null);
  const [bulkOperations, setBulkOperations] = useState<BulkOperationStatus[]>([]);
  const [overviewStats, setOverviewStats] = useState<MultiWearerStats>({
    totalRelationships: 0,
    activeRelationships: 0,
    totalActiveSessions: 0,
    totalEffectiveTime: 0,
    averageSessionLength: 0,
    recentActivity: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all relationships where user is keyholder
  useEffect(() => {
    if (!keyholderId) {
      setIsLoading(false);
      return;
    }

    const relationshipsQuery = query(
      collection(db, 'keyholderRelationships'),
      where('keyholderId', '==', keyholderId),
      where('status', 'in', ['active', 'pending'])
    );

    const unsubscribe = onSnapshot(relationshipsQuery, async (snapshot) => {
      const relationshipData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        lastActivity: doc.data().lastActivity?.toDate(),
      })) as KeyholderRelationship[];

      setRelationships(relationshipData);
      
      // Set first active relationship if none selected
      if (!activeRelationship && relationshipData.length > 0) {
        setActiveRelationship(relationshipData[0]);
      }

      // Update overview stats
      await updateOverviewStats(relationshipData);
      setIsLoading(false);
    }, (err) => {
      console.error('Error loading relationships:', err);
      setError('Failed to load relationships');
      setIsLoading(false);
    });

    return unsubscribe;
  }, [keyholderId, activeRelationship]);

  // Load bulk operations
  useEffect(() => {
    if (!keyholderId) return;

    const operationsQuery = query(
      collection(db, 'bulkOperations'),
      where('keyholderId', '==', keyholderId)
    );

    const unsubscribe = onSnapshot(operationsQuery, (snapshot) => {
      const operations = snapshot.docs.map(doc => ({
        id: doc.id,
        operation: {
          ...doc.data(),
          startedAt: doc.data().startedAt?.toDate(),
          completedAt: doc.data().completedAt?.toDate(),
        },
        results: doc.data().results || [],
      })) as BulkOperationStatus[];

      setBulkOperations(operations);
    });

    return unsubscribe;
  }, [keyholderId]);

  const updateOverviewStats = useCallback(async (relationshipData: KeyholderRelationship[]) => {
    try {
      // Calculate stats from relationships
      const activeRelationships = relationshipData.filter(r => r.status === 'active');
      const activeSessions = relationshipData.filter(r => r.hasActiveSession);

      // In a real implementation, you'd query session data for more detailed stats
      const stats: MultiWearerStats = {
        totalRelationships: relationshipData.length,
        activeRelationships: activeRelationships.length,
        totalActiveSessions: activeSessions.length,
        totalEffectiveTime: 0, // Would be calculated from session history
        averageSessionLength: 0, // Would be calculated from session history
        recentActivity: activeSessions.length, // Simplified metric
      };

      setOverviewStats(stats);
    } catch (err) {
      console.error('Error updating overview stats:', err);
    }
  }, []);

  // Actions
  const switchToRelationship = useCallback((relationshipId: string) => {
    const relationship = relationships.find(r => r.id === relationshipId);
    if (relationship) {
      setActiveRelationship(relationship);
    }
  }, [relationships]);

  const startBulkOperation = useCallback(async (
    operationData: Omit<BulkOperation, 'status' | 'progress' | 'startedAt' | 'errors'>
  ): Promise<BulkOperationStatus> => {
    try {
      const operation: BulkOperation = {
        ...operationData,
        status: 'pending',
        progress: 0,
        startedAt: new Date(),
        errors: [],
      };

      const operationDoc = await addDoc(collection(db, 'bulkOperations'), {
        ...operation,
        keyholderId,
        createdAt: serverTimestamp(),
      });

      const operationStatus: BulkOperationStatus = {
        id: operationDoc.id,
        operation,
        results: [],
      };

      // Process the bulk operation asynchronously
      processBulkOperation(operationStatus);

      return operationStatus;
    } catch (err) {
      console.error('Error starting bulk operation:', err);
      throw new Error('Failed to start bulk operation');
    }
  }, [keyholderId]);

  const processBulkOperation = useCallback(async (operationStatus: BulkOperationStatus) => {
    const { id, operation } = operationStatus;
    const results: BulkOperationResult[] = [];

    try {
      // Update status to in_progress
      await updateDoc(doc(db, 'bulkOperations', id), {
        'operation.status': 'in_progress',
        updatedAt: serverTimestamp(),
      });

      // Process each target
      for (let i = 0; i < operation.targetIds.length; i++) {
        const targetId = operation.targetIds[i];
        const progress = Math.floor(((i + 1) / operation.targetIds.length) * 100);

        try {
          let result: BulkOperationResult;

          switch (operation.type) {
            case 'start_sessions':
              result = await processBulkStartSession(targetId, operation.parameters);
              break;
            case 'stop_sessions':
              result = await processBulkStopSession(targetId, operation.parameters);
              break;
            case 'assign_tasks':
              result = await processBulkAssignTask(targetId, operation.parameters);
              break;
            case 'send_rewards':
              result = await processBulkSendReward(targetId, operation.parameters);
              break;
            case 'send_message':
              result = await processBulkSendMessage(targetId, operation.parameters);
              break;
            default:
              result = { relationshipId: targetId, success: false, error: 'Unknown operation type' };
          }

          results.push(result);

          // Update progress
          await updateDoc(doc(db, 'bulkOperations', id), {
            'operation.progress': progress,
            results,
            updatedAt: serverTimestamp(),
          });

        } catch (err) {
          results.push({
            relationshipId: targetId,
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      }

      // Mark as completed
      await updateDoc(doc(db, 'bulkOperations', id), {
        'operation.status': 'completed',
        'operation.progress': 100,
        'operation.completedAt': serverTimestamp(),
        results,
        updatedAt: serverTimestamp(),
      });

    } catch (err) {
      console.error('Error processing bulk operation:', err);
      
      // Mark as failed
      await updateDoc(doc(db, 'bulkOperations', id), {
        'operation.status': 'failed',
        'operation.errors': [err instanceof Error ? err.message : 'Unknown error'],
        updatedAt: serverTimestamp(),
      });
    }
  }, []);

  // Bulk operation processors
  const processBulkStartSession = useCallback(async (relationshipId: string, goals: SessionGoals): Promise<BulkOperationResult> => {
    try {
      // Start session for this relationship
      const sessionDoc = await addDoc(collection(db, 'chastitySession'), {
        userId: relationshipId,
        isActive: true,
        startTime: new Date(),
        goals: goals || { durationMinutes: 60 },
        status: 'active',
        controlledBy: keyholderId,
        createdAt: serverTimestamp(),
      });

      return {
        relationshipId,
        success: true,
        data: { sessionId: sessionDoc.id },
      };
    } catch (err) {
      return {
        relationshipId,
        success: false,
        error: err instanceof Error ? err.message : 'Failed to start session',
      };
    }
  }, [keyholderId]);

  const processBulkStopSession = useCallback(async (relationshipId: string, parameters: { reason?: string }): Promise<BulkOperationResult> => {
    try {
      // Find and stop active session
      const sessionQuery = query(
        collection(db, 'chastitySession'),
        where('userId', '==', relationshipId),
        where('isActive', '==', true)
      );

      // In a real implementation, you'd execute this query and update the session
      return {
        relationshipId,
        success: true,
        data: { stopped: true, reason: parameters.reason },
      };
    } catch (err) {
      return {
        relationshipId,
        success: false,
        error: err instanceof Error ? err.message : 'Failed to stop session',
      };
    }
  }, []);

  const processBulkAssignTask = useCallback(async (relationshipId: string, task: TaskTemplate): Promise<BulkOperationResult> => {
    try {
      await addDoc(collection(db, 'tasks'), {
        ...task,
        relationshipId,
        assignedBy: keyholderId,
        assignedAt: serverTimestamp(),
        status: 'pending',
      });

      return {
        relationshipId,
        success: true,
        data: { taskAssigned: task.title },
      };
    } catch (err) {
      return {
        relationshipId,
        success: false,
        error: err instanceof Error ? err.message : 'Failed to assign task',
      };
    }
  }, [keyholderId]);

  const processBulkSendReward = useCallback(async (relationshipId: string, reward: RewardAction): Promise<BulkOperationResult> => {
    try {
      await addDoc(collection(db, 'rewardPunishmentHistory'), {
        type: 'reward',
        actionId: reward.id,
        actionName: reward.name,
        relationshipId,
        impact: reward.impact,
        appliedBy: keyholderId,
        appliedAt: serverTimestamp(),
        result: 'success',
      });

      return {
        relationshipId,
        success: true,
        data: { rewardSent: reward.name },
      };
    } catch (err) {
      return {
        relationshipId,
        success: false,
        error: err instanceof Error ? err.message : 'Failed to send reward',
      };
    }
  }, [keyholderId]);

  const processBulkSendMessage = useCallback(async (relationshipId: string, parameters: { message: string }): Promise<BulkOperationResult> => {
    try {
      await addDoc(collection(db, 'messages'), {
        fromKeyholderId: keyholderId,
        toRelationshipId: relationshipId,
        message: parameters.message,
        sentAt: serverTimestamp(),
        type: 'broadcast',
      });

      return {
        relationshipId,
        success: true,
        data: { messageSent: true },
      };
    } catch (err) {
      return {
        relationshipId,
        success: false,
        error: err instanceof Error ? err.message : 'Failed to send message',
      };
    }
  }, [keyholderId]);

  // Bulk operations shortcuts
  const bulkStartSessions = useCallback(async (relationshipIds: string[], goals?: SessionGoals): Promise<void> => {
    await startBulkOperation({
      type: 'start_sessions',
      targetIds: relationshipIds,
      parameters: goals || { durationMinutes: 60 },
    });
  }, [startBulkOperation]);

  const bulkStopSessions = useCallback(async (relationshipIds: string[], reason?: string): Promise<void> => {
    await startBulkOperation({
      type: 'stop_sessions',
      targetIds: relationshipIds,
      parameters: { reason },
    });
  }, [startBulkOperation]);

  const bulkAssignTasks = useCallback(async (relationshipIds: string[], task: TaskTemplate): Promise<void> => {
    await startBulkOperation({
      type: 'assign_tasks',
      targetIds: relationshipIds,
      parameters: task,
    });
  }, [startBulkOperation]);

  const bulkSendRewards = useCallback(async (relationshipIds: string[], reward: RewardAction): Promise<void> => {
    await startBulkOperation({
      type: 'send_rewards',
      targetIds: relationshipIds,
      parameters: reward,
    });
  }, [startBulkOperation]);

  // Communication
  const sendBroadcastMessage = useCallback(async (message: string, recipients: string[]): Promise<void> => {
    try {
      const batch = writeBatch(db);
      
      recipients.forEach(relationshipId => {
        const messageRef = doc(collection(db, 'messages'));
        batch.set(messageRef, {
          fromKeyholderId: keyholderId,
          toRelationshipId: relationshipId,
          message,
          sentAt: serverTimestamp(),
          type: 'broadcast',
        });
      });

      await batch.commit();
    } catch (err) {
      console.error('Error sending broadcast message:', err);
      throw new Error('Failed to send broadcast message');
    }
  }, [keyholderId]);

  const sendIndividualMessage = useCallback(async (relationshipId: string, message: string): Promise<void> => {
    try {
      await addDoc(collection(db, 'messages'), {
        fromKeyholderId: keyholderId,
        toRelationshipId: relationshipId,
        message,
        sentAt: serverTimestamp(),
        type: 'individual',
      });
    } catch (err) {
      console.error('Error sending individual message:', err);
      throw new Error('Failed to send message');
    }
  }, [keyholderId]);

  // Analytics
  const getComparativeStats = useCallback(async (relationshipIds: string[]): Promise<ComparativeStats> => {
    try {
      // In a real implementation, you'd query session and activity data
      const relationships: RelationshipComparison[] = relationshipIds.map(id => {
        const relationship = relationships.find(r => r.id === id);
        return {
          relationshipId: id,
          submissiveName: relationship?.submissiveName || 'Unknown',
          totalSessionTime: 0, // Would be calculated from history
          sessionsCompleted: 0, // Would be calculated from history
          complianceRate: 0, // Would be calculated from completion rates
          lastActiveDate: relationship?.lastActivity || new Date(),
          currentStreak: 0, // Would be calculated from recent activity
          needsAttention: relationship?.needsAttention || false,
        };
      });

      const aggregates = {
        totalTime: relationships.reduce((sum, r) => sum + r.totalSessionTime, 0),
        averageCompliance: relationships.reduce((sum, r) => sum + r.complianceRate, 0) / relationships.length,
        mostActive: relationships.sort((a, b) => b.totalSessionTime - a.totalSessionTime)[0]?.relationshipId || '',
        needingAttention: relationships.filter(r => r.needsAttention).map(r => r.relationshipId),
      };

      return {
        relationships,
        aggregates,
      };
    } catch (err) {
      console.error('Error getting comparative stats:', err);
      throw new Error('Failed to get comparative stats');
    }
  }, [relationships]);

  // Computed values
  const totalRelationships = relationships.length;
  const activeSessions = relationships.filter(r => r.hasActiveSession).length;
  const requiresAttention = relationships.filter(r => r.needsAttention).length;
  const canPerformBulkOperations = relationships.length > 1;

  return {
    // State
    relationships,
    activeRelationship,
    overviewStats,
    bulkOperations,
    isLoading,
    error,

    // Relationship management
    switchToRelationship,

    // Bulk operations
    startBulkOperation,
    bulkStartSessions,
    bulkStopSessions,
    bulkAssignTasks,
    bulkSendRewards,

    // Communication
    sendBroadcastMessage,
    sendIndividualMessage,

    // Analytics
    getComparativeStats,

    // Computed
    totalRelationships,
    activeSessions,
    requiresAttention,
    canPerformBulkOperations,

    // Quick access
    hasMultipleRelationships: totalRelationships > 1,
    allRelationshipIds: relationships.map(r => r.id),
    activeRelationshipIds: relationships.filter(r => r.status === 'active').map(r => r.id),
  };
};