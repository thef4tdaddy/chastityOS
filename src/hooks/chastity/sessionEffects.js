import { useEffect, useRef } from 'react';
import { setDoc, onSnapshot, getDoc } from 'firebase/firestore';

export function useSessionEffects({
    isAuthReady, userId, getDocRef, applyRestoredData,
    isCageOn, showRestoreSessionPrompt, setLoadedSessionData, setShowRestoreSessionPrompt,
    chastityHistory, setTotalChastityTime, setOverallTotalPauseTime,
    hasSessionEverBeenActive, isPaused, cageOnTime, pauseStartTime,
    setTimeInChastity, setTimeCageOff, setLivePauseDuration
}) {
    const timerInChastityRef = useRef(null);
    const timerCageOffRef = useRef(null);
    const pauseDisplayTimerRef = useRef(null);

    useEffect(() => {
        if (!isAuthReady || !userId) return;
        const docRef = getDocRef();
        if (!docRef) return;
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.isCageOn && !isCageOn && !showRestoreSessionPrompt && data.cageOnTime) {
                    setLoadedSessionData(data);
                    setShowRestoreSessionPrompt(true);
                } else {
                    applyRestoredData(data);
                }
            } else {
                applyRestoredData({});
            }
        }, (error) => {
            console.error("Error listening to session data:", error);
        });
        return () => unsubscribe();
    }, [isAuthReady, userId, getDocRef, applyRestoredData, isCageOn, showRestoreSessionPrompt, setLoadedSessionData, setShowRestoreSessionPrompt]);

    useEffect(() => {
        if (!isAuthReady || !userId) return;
        const ensureUserDocExists = async () => {
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
        };
        ensureUserDocExists();
    }, [isAuthReady, userId, getDocRef]);

    useEffect(() => {
        let totalEffective = 0;
        let totalPaused = 0;
        chastityHistory.forEach(p => {
            totalEffective += (p.duration || 0) - (p.totalPauseDurationSeconds || 0);
            totalPaused += p.totalPauseDurationSeconds || 0;
        });
        setTotalChastityTime(totalEffective);
        setOverallTotalPauseTime(totalPaused);
    }, [chastityHistory, setTotalChastityTime, setOverallTotalPauseTime]);

    useEffect(() => {
        clearInterval(timerInChastityRef.current);
        clearInterval(timerCageOffRef.current);
        clearInterval(pauseDisplayTimerRef.current);
        if (isCageOn && !isPaused && cageOnTime) {
            timerInChastityRef.current = setInterval(() => {
                const now = new Date();
                const elapsed = Math.floor((now.getTime() - cageOnTime.getTime()) / 1000);
                setTimeInChastity(elapsed);
            }, 1000);
        } else if (!isCageOn && hasSessionEverBeenActive) {
            timerCageOffRef.current = setInterval(() => setTimeCageOff(prev => prev + 1), 1000);
        }
        if (isPaused && pauseStartTime) {
            pauseDisplayTimerRef.current = setInterval(() => {
                setLivePauseDuration(Math.floor((new Date().getTime() - pauseStartTime.getTime()) / 1000));
            }, 1000);
        } else {
            setLivePauseDuration(0);
        }
        return () => {
            clearInterval(timerInChastityRef.current);
            clearInterval(timerCageOffRef.current);
            clearInterval(pauseDisplayTimerRef.current);
        };
    }, [isCageOn, isPaused, cageOnTime, hasSessionEverBeenActive, pauseStartTime, setTimeInChastity, setTimeCageOff, setLivePauseDuration]);
}