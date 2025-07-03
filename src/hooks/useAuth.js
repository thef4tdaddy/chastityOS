// src/hooks/useAuth.js
import { useState, useEffect, useCallback, useRef } from 'react';
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
    const previousUserRef = useRef(); // Ref to hold the previous user state

    useEffect(() => {
        // Store the current user in the ref whenever it changes so we can compare
        previousUserRef.current = user;
    }, [user]);

    useEffect(() => {
        // This effect should only run once to set up the listener.
        const unsubscribe = onAuthStateChanged(auth, async (u) => {
            const previousUser = previousUserRef.current; // Get the previous user from the ref

            if (u) {
                // Handle data migration when an anonymous user signs up with Google
                if (previousUser && previousUser.isAnonymous && !u.isAnonymous && previousUser.uid !== u.uid) {
                    const anonDocRef = doc(db, "users", previousUser.uid);
                    const newDocRef = doc(db, "users", u.uid);
                    try {
                        const anonSnap = await getDoc(anonDocRef);
                        if (anonSnap.exists()) {
                            const dataToMigrate = anonSnap.data();
                            await setDoc(newDocRef, dataToMigrate, { merge: true });
                            await deleteDoc(anonDocRef);
                            console.log("Anonymous data migrated successfully.");
                        }
                    } catch (err) {
                        console.error("Failed to migrate anonymous data:", err);
                    }
                }
                setUserId(u.uid);
                setGoogleEmail(!u.isAnonymous ? u.email : null);
                setUser(u);
                setIsAuthReady(true);
                setIsLoading(false);
            } else {
                // If no user, sign in anonymously
                try {
                    await signInAnonymously(auth);
                    // The onAuthStateChanged listener will fire again with the new anonymous user,
                    // which will be handled by the `if (u)` block above.
                } catch (error) {
                    console.error("Anonymous sign-in failed:", error);
                    setUser(null);
                    setUserId(null);
                    setGoogleEmail(null);
                    setIsAuthReady(true);
                    setIsLoading(false); // Stop loading on error
                }
            }
        });
        return () => unsubscribe();
    }, []); // Empty dependency array ensures this runs only once.

    const handleToggleUserIdVisibility = useCallback(() => {
        setShowUserIdInSettings(prev => !prev);
    }, []);

    return {
        user,
        primaryUserId: userId,
        activeUserId: user ? user.uid : null,
        googleEmail,
        isAuthReady,
        isLoading,
        showUserIdInSettings,
        handleToggleUserIdVisibility
    };
};