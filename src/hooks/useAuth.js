// src/hooks/useAuth.js
import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [userId, setUserId] = useState(null);
    const [googleEmail, setGoogleEmail] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showUserIdInSettings, setShowUserIdInSettings] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (u) => {
            setIsLoading(true);
            if (u) {
                // Handle potential data migration from anonymous to Google account
                if (user && user.isAnonymous && !u.isAnonymous && user.uid !== u.uid) {
                    const anonDocRef = doc(db, "users", user.uid);
                    const newDocRef = doc(db, "users", u.uid);
                    try {
                        const anonSnap = await getDoc(anonDocRef);
                        if (anonSnap.exists()) {
                            const dataToMigrate = anonSnap.data();
                            await setDoc(newDocRef, dataToMigrate, { merge: true });
                            await deleteDoc(anonDocRef);
                        }
                    } catch (err) {
                        console.error("Failed to migrate anonymous data:", err);
                    }
                }
                setUserId(u.uid);
                setGoogleEmail(!u.isAnonymous ? u.email : null);
                setUser(u);
            } else {
                // If no user, sign in anonymously
                try {
                    const userCredential = await signInAnonymously(auth);
                    setUser(userCredential.user);
                    setUserId(userCredential.user.uid);
                    setGoogleEmail(null);
                } catch (error) {
                    console.error("Anonymous sign-in failed:", error);
                    setUser(null);
                    setUserId(null);
                    setGoogleEmail(null);
                }
            }
            setIsAuthReady(true);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    const handleToggleUserIdVisibility = useCallback(() => {
        setShowUserIdInSettings(prev => !prev);
    }, []);

    return {
        user,
        userId,
        googleEmail,
        isAuthReady,
        isLoading,
        showUserIdInSettings,
        handleToggleUserIdVisibility
    };
};
