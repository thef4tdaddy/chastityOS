import { useState, useCallback } from 'react';
import { sha256 } from '../../utils/hash';

interface UseKeyholderSessionProps {
  settings?: {
    keyholderName?: string;
    keyholderPasswordHash?: string;
  };
  setSettings: (updater: (prev: any) => any) => void;
}

export const useKeyholderSession = ({ settings, setSettings }: UseKeyholderSessionProps) => {
  const [isKeyholderModeUnlocked, setIsKeyholderModeUnlocked] = useState(false);
  const [keyholderMessage, setKeyholderMessage] = useState('');

  const generateTempPassword = useCallback(() => 
    Math.random().toString(36).substring(2, 8).toUpperCase(), []
  );

  const handleSetKeyholderName = useCallback(async (name: string) => {
    const tempPassword = generateTempPassword();
    const hash = await sha256(tempPassword);
    setSettings(prev => ({ ...prev, keyholderName: name, keyholderPasswordHash: hash }));
    setKeyholderMessage(`Your keyholder password is: ${tempPassword}. This is now the permanent password unless you set a custom one.`);
  }, [setSettings, generateTempPassword]);

  const handleKeyholderPasswordCheck = useCallback(async (passwordAttempt: string) => {
    const storedHash = settings?.keyholderPasswordHash;
    if (!storedHash) {
      setKeyholderMessage("Error: No keyholder password is set in the database.");
      return;
    }
    const attemptHash = await sha256(passwordAttempt);
    if (attemptHash === storedHash) {
      setIsKeyholderModeUnlocked(true);
      setKeyholderMessage('Controls are now unlocked.');
    } else {
      setKeyholderMessage('Incorrect password. Please try again.');
    }
  }, [settings?.keyholderPasswordHash]);

  const handleSetPermanentPassword = useCallback(async (newPassword: string) => {
    if (!newPassword || newPassword.length < 6) {
      setKeyholderMessage("Password must be at least 6 characters long.");
      return;
    }
    const newHash = await sha256(newPassword);
    setSettings(prev => ({ ...prev, keyholderPasswordHash: newHash }));
    setKeyholderMessage("Permanent password has been updated successfully!");
  }, [setSettings]);

  const lockKeyholderControls = useCallback(() => {
    setIsKeyholderModeUnlocked(false);
    setKeyholderMessage('');
  }, []);

  return {
    isKeyholderModeUnlocked,
    keyholderMessage,
    handleSetKeyholderName,
    handleKeyholderPasswordCheck,
    handleSetPermanentPassword,
    lockKeyholderControls,
    setKeyholderMessage
  };
};