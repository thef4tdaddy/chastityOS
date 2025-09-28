import { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

// Types and Interfaces
export interface KeyholderRelationship {
  id: string;
  keyholderId: string;
  submissiveId: string;
  submissiveName?: string;
  status: 'active' | 'pending' | 'suspended' | 'ended';
  createdAt: Date;
  lastActivity?: Date;
  hasActiveSession: boolean;
  needsAttention: boolean;
  permissions: string[];
}

export interface AdminSession {
  id: string;
  keyholderId: string;
  relationshipId: string;
  startTime: Date;
  expiresAt: Date;
  permissions: AdminPermission[];
  isActive: boolean;
  lastActivity: Date;
}

export interface KeyholderStatus {
  isActive: boolean;
  canCreateInvites: boolean;
  maxRelationships: number;
  currentRelationships: number;
}

export interface KeyholderStats {
  totalRelationships: number;
  activeRelationships: number;
  totalSessionTime: number;
  rewardsGiven: number;
  punishmentsGiven: number;
  activeSessions: number;
}

export interface InviteOptions {
  expiresIn?: number; // hours
  maxUses?: number;
  permissions?: string[];
  customMessage?: string;
}

export interface BulkOperations {
  startSessions: (relationshipIds: string[], goals?: any) => Promise<void>;
  stopSessions: (relationshipIds: string[], reason?: string) => Promise<void>;
  sendMessage: (relationshipIds: string[], message: string) => Promise<void>;
}

export type AdminPermission = 
  | 'session_control'
  | 'time_modification' 
  | 'task_management'
  | 'reward_punishment'
  | 'emergency_unlock'
  | 'relationship_management';

export interface KeyholderSystemState {
  activeRelationships: KeyholderRelationship[];
  adminSession: AdminSession | null;
  keyholderStatus: KeyholderStatus;
  stats: KeyholderStats;
}

export interface KeyholderSystemActions {
  createInviteCode: (options: InviteOptions) => Promise<string>;
  acceptSubmissive: (inviteCode: string) => Promise<KeyholderRelationship>;
  removeSubmissive: (relationshipId: string) => Promise<void>;
  startAdminSession: (relationshipId: string, duration?: number) => Promise<AdminSession>;
  endAdminSession: () => Promise<void>;
  switchActiveRelationship: (relationshipId: string) => void;
  getBulkOperations: () => BulkOperations;
}

export const useKeyholderSystem = (keyholderId: string) => {
  // State
  const [activeRelationships, setActiveRelationships] = useState<KeyholderRelationship[]>([]);
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRelationshipId, setActiveRelationshipId] = useState<string | null>(null);

  // Computed keyholder status
  const keyholderStatus: KeyholderStatus = useMemo(() => ({
    isActive: activeRelationships.length > 0,
    canCreateInvites: true, // Could be based on subscription/limits
    maxRelationships: 10, // Could be configurable
    currentRelationships: activeRelationships.length,
  }), [activeRelationships]);

  // Computed stats
  const stats: KeyholderStats = useMemo(() => ({
    totalRelationships: activeRelationships.length,
    activeRelationships: activeRelationships.filter(r => r.status === 'active').length,
    totalSessionTime: 0, // Would be calculated from sessions
    rewardsGiven: 0, // Would be calculated from history
    punishmentsGiven: 0, // Would be calculated from history
    activeSessions: activeRelationships.filter(r => r.hasActiveSession).length,
  }), [activeRelationships]);

  // Load relationships from Firestore
  useEffect(() => {
    if (!keyholderId) return;

    const relationshipsQuery = query(
      collection(db, 'keyholderRelationships'),
      where('keyholderId', '==', keyholderId),
      where('status', 'in', ['active', 'pending'])
    );

    const unsubscribe = onSnapshot(relationshipsQuery, (snapshot) => {
      const relationships = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        lastActivity: doc.data().lastActivity?.toDate(),
      })) as KeyholderRelationship[];

      setActiveRelationships(relationships);
      setIsLoading(false);
    }, (err) => {
      console.error('Error loading relationships:', err);
      setError('Failed to load relationships');
      setIsLoading(false);
    });

    return unsubscribe;
  }, [keyholderId]);

  // Load admin session
  useEffect(() => {
    if (!keyholderId) return;

    const sessionQuery = query(
      collection(db, 'adminSessions'),
      where('keyholderId', '==', keyholderId),
      where('isActive', '==', true)
    );

    const unsubscribe = onSnapshot(sessionQuery, (snapshot) => {
      const sessions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime?.toDate(),
        expiresAt: doc.data().expiresAt?.toDate(),
        lastActivity: doc.data().lastActivity?.toDate(),
      })) as AdminSession[];

      // Should only be one active session
      setAdminSession(sessions[0] || null);
    });

    return unsubscribe;
  }, [keyholderId]);

  // Actions
  const createInviteCode = useCallback(async (options: InviteOptions = {}): Promise<string> => {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + (options.expiresIn || 24));

      const inviteDoc = await addDoc(collection(db, 'inviteCodes'), {
        keyholderId,
        code: generateInviteCode(),
        expiresAt,
        maxUses: options.maxUses || 1,
        usedCount: 0,
        permissions: options.permissions || ['basic_submissive'],
        customMessage: options.customMessage || '',
        createdAt: serverTimestamp(),
        isActive: true,
      });

      const invite = await inviteDoc.get();
      return invite.data()?.code || '';
    } catch (err) {
      console.error('Error creating invite code:', err);
      throw new Error('Failed to create invite code');
    }
  }, [keyholderId]);

  const acceptSubmissive = useCallback(async (inviteCode: string): Promise<KeyholderRelationship> => {
    try {
      // In a real implementation, this would validate the invite code
      // and create a relationship between keyholder and submissive
      const relationshipDoc = await addDoc(collection(db, 'keyholderRelationships'), {
        keyholderId,
        // submissiveId would come from the current user accepting the invite
        status: 'active',
        createdAt: serverTimestamp(),
        hasActiveSession: false,
        needsAttention: false,
        permissions: ['basic_submissive'],
      });

      const relationship = {
        id: relationshipDoc.id,
        keyholderId,
        submissiveId: '', // Would be filled from context
        status: 'active' as const,
        createdAt: new Date(),
        hasActiveSession: false,
        needsAttention: false,
        permissions: ['basic_submissive'],
      };

      return relationship;
    } catch (err) {
      console.error('Error accepting submissive:', err);
      throw new Error('Failed to accept submissive');
    }
  }, [keyholderId]);

  const removeSubmissive = useCallback(async (relationshipId: string): Promise<void> => {
    try {
      await updateDoc(doc(db, 'keyholderRelationships', relationshipId), {
        status: 'ended',
        endedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Error removing submissive:', err);
      throw new Error('Failed to remove submissive');
    }
  }, []);

  const startAdminSession = useCallback(async (relationshipId: string, duration = 30): Promise<AdminSession> => {
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + duration * 60000); // duration in minutes

      const sessionDoc = await addDoc(collection(db, 'adminSessions'), {
        keyholderId,
        relationshipId,
        startTime: now,
        expiresAt,
        permissions: [
          'session_control',
          'time_modification',
          'task_management',
          'reward_punishment'
        ] as AdminPermission[],
        isActive: true,
        lastActivity: now,
        createdAt: serverTimestamp(),
      });

      const session: AdminSession = {
        id: sessionDoc.id,
        keyholderId,
        relationshipId,
        startTime: now,
        expiresAt,
        permissions: [
          'session_control',
          'time_modification', 
          'task_management',
          'reward_punishment'
        ],
        isActive: true,
        lastActivity: now,
      };

      return session;
    } catch (err) {
      console.error('Error starting admin session:', err);
      throw new Error('Failed to start admin session');
    }
  }, [keyholderId]);

  const endAdminSession = useCallback(async (): Promise<void> => {
    if (!adminSession) return;

    try {
      await updateDoc(doc(db, 'adminSessions', adminSession.id), {
        isActive: false,
        endedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Error ending admin session:', err);
      throw new Error('Failed to end admin session');
    }
  }, [adminSession]);

  const switchActiveRelationship = useCallback((relationshipId: string) => {
    setActiveRelationshipId(relationshipId);
  }, []);

  const getBulkOperations = useCallback((): BulkOperations => ({
    startSessions: async (relationshipIds: string[], goals?: any) => {
      // Implementation would start sessions for multiple relationships
      console.log('Starting bulk sessions for:', relationshipIds, goals);
    },
    stopSessions: async (relationshipIds: string[], reason?: string) => {
      // Implementation would stop sessions for multiple relationships
      console.log('Stopping bulk sessions for:', relationshipIds, reason);
    },
    sendMessage: async (relationshipIds: string[], message: string) => {
      // Implementation would send messages to multiple submissives
      console.log('Sending bulk message to:', relationshipIds, message);
    },
  }), []);

  // Computed values
  const hasActiveRelationships = activeRelationships.length > 0;
  const canStartAdminSession = adminSession === null;
  const activeRelationshipCount = activeRelationships.length;

  return {
    // State
    activeRelationships,
    adminSession,
    keyholderStatus,
    stats,
    isLoading,
    error,
    activeRelationshipId,

    // Actions
    createInviteCode,
    acceptSubmissive,
    removeSubmissive,
    startAdminSession,
    endAdminSession,
    switchActiveRelationship,
    getBulkOperations,

    // Computed
    hasActiveRelationships,
    canStartAdminSession,
    activeRelationshipCount,
  };
};

// Helper function to generate invite codes
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}