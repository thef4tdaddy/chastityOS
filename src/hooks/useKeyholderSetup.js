import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
// FIX: Changed to use the new standardized 'hash' and 'verify' functions.
import { hash, verify } from '../utils/hash';
import { toast } from 'react-toastify';

export const useKeyholderSetup = () => {
  const { user } = useAuth();
  const [khUsername, setKhUsername] = useState('');
  const [khUserId, setKhUserId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const findUserByUsername = useCallback(async () => {
    if (!khUsername) {
      toast.error('Please enter a username.');
      return;
    }
    // In a real application, you would query Firestore to find the user.
    // This is a placeholder for that logic.
    console.log(`Searching for user: ${khUsername}`);
    // For now, we'll mock a successful find for demonstration.
    setKhUserId('mock-kh-user-id');
    toast.success(`Found user ${khUsername}!`);
  }, [khUsername]);

  const setupKeyholder = useCallback(async (password) => {
    if (!user || !khUserId || !password) {
      toast.error('Missing user ID or password.');
      return;
    }
    setIsVerifying(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      // FIX: Using the standardized 'hash' function.
      const passwordHash = hash(password);
      await updateDoc(userDocRef, {
        'settings.keyholder.id': khUserId,
        'settings.keyholder.username': khUsername,
        'settings.keyholder.password': passwordHash,
        'settings.keyholder.isVerified': true,
      });
      toast.success('Keyholder set up successfully!');
    } catch (error) {
      console.error('Error setting up keyholder:', error);
      toast.error('Failed to set up keyholder.');
    } finally {
      setIsVerifying(false);
    }
  }, [user, khUserId, khUsername]);

  const removeKeyholder = useCallback(async () => {
    if (!user) return;
    setIsVerifying(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        'settings.keyholder': {},
      });
      toast.success('Keyholder removed.');
    } catch (error) {
      console.error('Error removing keyholder:', error);
      toast.error('Failed to remove keyholder.');
    } finally {
      setIsVerifying(false);
    }
  }, [user]);
  
  const verifyKhPassword = useCallback(async (password) => {
    if (!user || !password) return false;
    
    const userDocRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
        const khData = docSnap.data().settings?.keyholder;
        if (khData?.password) {
            // FIX: Using the standardized 'verify' function.
            const isMatch = verify(password, khData.password);
            if (!isMatch) {
                toast.error('Incorrect password.');
            }
            return isMatch;
        }
    }
    return false;
  }, [user]);

  return {
    khUsername,
    setKhUsername,
    khUserId,
    findUserByUsername,
    setupKeyholder,
    removeKeyholder,
    verifyKhPassword,
    isVerifying,
  };
};
