import { useState } from 'react';
import { generateHash } from '../utils/hash';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-toastify';
import * as Sentry from '@sentry/react';

export function useKeyholderSetup(userId) {
  const [generatedPassword, setGeneratedPassword] = useState('');

  const handleSetKeyholder = async (name) => {
    if (generatedPassword) {
      toast.error('Password already generated. Reset all data to generate a new one.');
      return;
    }

    const password = Math.random().toString(36).slice(-8);
    setGeneratedPassword(password);

    const hash = await generateHash(password);
    const userRef = doc(db, 'users', userId);

    Sentry.setUser({ id: userId });
    Sentry.setTag('context', 'keyholder_setup');

    try {
      await setDoc(userRef, {
        keyholderName: name,
        keyholderPasswordHash: hash
      }, { merge: true });
      toast.success(`Keyholder "${name}" set. Password preview generated.`);
    } catch (error) {
      console.error('🔥 Firestore update failed:', error);
      toast.error('Password was generated but could not be saved to the cloud.');
      console.warn('⚠️ Returning fallback password and hash');
      return { password, hash }; // Fallback return
    }

    if (!hash || !password) {
      console.error('❌ Missing password or hash in return.');
      return null;
    }
    return { password, hash };
  };

  return {
    generatedPassword,
    setGeneratedPassword,
    handleSetKeyholder
  };
}