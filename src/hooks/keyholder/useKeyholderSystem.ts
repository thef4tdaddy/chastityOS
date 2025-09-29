import { useState, useCallback } from 'react';

interface KeyholderState {
  isLocked: boolean;
  keyholderName: string;
  hasPassword: boolean;
  isUnlocked: boolean;
  lastActivity: Date | null;
}

interface UseKeyholderSystemProps {
  userId: string | null;
  isAuthReady: boolean;
  initialKeyholderName?: string;
  initialPasswordHash?: string | null;
}

export const useKeyholderSystem = ({
  userId,
  isAuthReady,
  initialKeyholderName = '',
  initialPasswordHash = null
}: UseKeyholderSystemProps) => {
  const [keyholderState, setKeyholderState] = useState<KeyholderState>({
    isLocked: true,
    keyholderName: initialKeyholderName,
    hasPassword: Boolean(initialPasswordHash),
    isUnlocked: false,
    lastActivity: null
  });

  const [message, setMessage] = useState<string>('');

  const handleSetKeyholderName = useCallback((name: string) => {
    if (!userId || !isAuthReady) return;

    setKeyholderState(prev => ({
      ...prev,
      keyholderName: name.trim()
    }));

    setMessage(`Keyholder name set to: ${name}`);
    setTimeout(() => setMessage(''), 3000);
  }, [userId, isAuthReady]);

  const handleVerifyPassword = useCallback(async (password: string): Promise<boolean> => {
    if (!keyholderState.hasPassword) {
      setMessage('No password has been set');
      return false;
    }

    // In a real implementation, this would verify against the stored hash
    const isValid = password.length > 0; // Simplified validation

    if (isValid) {
      setKeyholderState(prev => ({
        ...prev,
        isUnlocked: true,
        lastActivity: new Date()
      }));
      setMessage('Access granted');
    } else {
      setMessage('Invalid password');
    }

    setTimeout(() => setMessage(''), 3000);
    return isValid;
  }, [keyholderState.hasPassword]);

  const handleLockControls = useCallback(() => {
    setKeyholderState(prev => ({
      ...prev,
      isUnlocked: false,
      lastActivity: null
    }));
    setMessage('Controls locked');
    setTimeout(() => setMessage(''), 3000);
  }, []);

  const handleSetPassword = useCallback((newPassword: string) => {
    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setKeyholderState(prev => ({
      ...prev,
      hasPassword: true
    }));

    setMessage('Password updated successfully');
    setTimeout(() => setMessage(''), 3000);
  }, []);

  const handleGenerateTemporaryPassword = useCallback((): string => {
    const tempPassword = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    setKeyholderState(prev => ({
      ...prev,
      hasPassword: true
    }));

    setMessage(`Temporary password: ${tempPassword}`);
    
    return tempPassword;
  }, []);

  const canAccess = useCallback((): boolean => {
    return keyholderState.isUnlocked && keyholderState.hasPassword;
  }, [keyholderState.isUnlocked, keyholderState.hasPassword]);

  return {
    ...keyholderState,
    message,
    handleSetKeyholderName,
    handleVerifyPassword,
    handleLockControls,
    handleSetPassword,
    handleGenerateTemporaryPassword,
    canAccess
  };
};