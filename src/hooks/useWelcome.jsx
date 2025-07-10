import { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useActiveUser } from './useActiveUser';
import WelcomeModal from '../components/WelcomeModal';
import { db } from '../firebase';
import { log }   from '../utils/logging';

/**
 * Manages the welcome modal logic, including anonymous user creation
 * and persisting the acceptance state in Firestore.
 */
export const useWelcome = () => {
  const { userId, isAuthReady, loginAnonymously } = useActiveUser();
  const [hasAccepted, setHasAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // This effect checks the user's acceptance status from Firestore
  // once they are authenticated.
  useEffect(() => {
    // Wait until the initial Firebase auth check is complete.
    if (!isAuthReady) {
      return;
    }

    // If auth is ready but there's no user, they haven't accepted yet.
    // We can stop loading and prepare to show the modal.
    if (!userId) {
      setHasAccepted(false);
      setIsLoading(false);
      return;
    }

    // If a user is logged in, fetch their acceptance status.
    const fetchAcceptance = async () => {
      const userDocRef = doc(db, 'users', userId);
      try {
        const snap = await getDoc(userDocRef);
        // If the document exists and `welcomeAccepted` is true, update the state.
        // Otherwise, they are considered to have not accepted.
        setHasAccepted(snap.exists() && !!snap.data().welcomeAccepted);
      } catch (err) {
        log.error('Failed to load user acceptance info:', err);
        setHasAccepted(false); // Assume not accepted on error.
      } finally {
        setIsLoading(false);
      }
    };

    fetchAcceptance();
  }, [userId, isAuthReady]);

  // This function is called when a NEW user clicks the 'accept' button.
  const accept = useCallback(async () => {
    log.info('WelcomeModal accepted by a new user.');
    try {
      // First, create the anonymous account. This will return a user credential.
      const userCredential = await loginAnonymously();
      const newUserId = userCredential.user.uid;

      // If we successfully created a new user, record their acceptance in Firestore.
      if (newUserId) {
        const userDocRef = doc(db, 'users', newUserId);
        await setDoc(userDocRef, { welcomeAccepted: true }, { merge: true });
        setHasAccepted(true); // Update state to hide the modal immediately.
        log.info('Acceptance recorded successfully for new user:', newUserId);
      }
    } catch (err) {
      log.error('Failed during the acceptance process:', err);
    }
  }, [loginAnonymously]);

  // Determine whether to show the welcome modal.
  // We don't show it while loading or if it has already been accepted.
  const showWelcome = !isLoading && !hasAccepted;

  const WelcomeModalComponent = useMemo(() => {
    if (!showWelcome) {
      return null;
    }
    return <WelcomeModal onAccept={accept} />;
  }, [showWelcome, accept]);

  return {
    showWelcome,
    isLoading, // You can use this to show a loading spinner in your App.jsx
    WelcomeModal: WelcomeModalComponent,
  };
};
