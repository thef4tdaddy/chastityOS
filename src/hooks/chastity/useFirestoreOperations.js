import { useCallback } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

/**
 * Custom hook for Firestore operations related to chastity sessions
 */
export const useFirestoreOperations = (userId, isAuthReady) => {
    const getDocRef = useCallback((targetUserId = userId) => {
        if (!targetUserId) return null;
        return doc(db, "users", targetUserId);
    }, [userId]);

    const saveDataToFirestore = useCallback(async (dataToSave) => {
        if (!isAuthReady || !userId) {
            console.warn("Attempted to save data before authentication was ready or user ID was available.");
            return;
        }
        const docRef = getDocRef();
        if (!docRef) {
            console.error("Firestore document reference is null, cannot save data.");
            return;
        }
        try {
            await setDoc(docRef, dataToSave, { merge: true });
        } catch (error) {
            console.error("Error saving session data to Firestore:", error);
        }
    }, [isAuthReady, userId, getDocRef]);

    const ensureUserDocExists = useCallback(async () => {
        if (!isAuthReady || !userId) return;
        try {
            const docRef = getDocRef();
            if (!docRef) return;
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
                console.log("🆕 Creating default user doc for:", userId);
                await setDoc(docRef, {
                    isCageOn: false,
                    chastityHistory: [],
                    totalTimeCageOff: 0,
                    hasSessionEverBeenActive: false,
                    isPaused: false,
                    accumulatedPauseTimeThisSession: 0,
                    requiredKeyholderDurationSeconds: 0
                });
            }
        } catch (error) {
            console.error("Error checking/creating Firestore user doc:", error);
        }
    }, [isAuthReady, userId, getDocRef]);

    return {
        getDocRef,
        saveDataToFirestore,
        ensureUserDocExists
    };
};