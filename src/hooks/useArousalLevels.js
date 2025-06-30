import { useState, useCallback, useEffect } from 'react';
import { collection, addDoc, query, orderBy, getDocs, limit, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

// Maximum frequency to log arousal level (in hours)
const AR0USAL_INTERVAL_HOURS = 8;

export const useArousalLevels = (userId, isAuthReady) => {
  const [arousalLevels, setArousalLevels] = useState([]);
  const [isLoadingArousal, setIsLoadingArousal] = useState(false);
  const [arousalMessage, setArousalMessage] = useState('');
  const [newArousalLevel, setNewArousalLevel] = useState(5);
  const [newArousalNotes, setNewArousalNotes] = useState('');

  const getArousalCollectionRef = useCallback(() => {
    if (!userId) return null;
    return collection(db, 'users', userId, 'arousalLevels');
  }, [userId]);

  const fetchArousalLevels = useCallback(async () => {
    if (!isAuthReady || !userId) return;
    const colRef = getArousalCollectionRef();
    if (!colRef) return;
    setIsLoadingArousal(true);
    try {
      const q = query(colRef, orderBy('timestamp', 'desc'));
      const snap = await getDocs(q);
      setArousalLevels(
        snap.docs.map(d => ({ id: d.id, ...d.data(), timestamp: d.data().timestamp?.toDate() }))
      );
    } catch (err) {
      console.error('Error fetching arousal levels:', err);
    } finally {
      setIsLoadingArousal(false);
    }
  }, [isAuthReady, userId, getArousalCollectionRef]);

  useEffect(() => {
    if (isAuthReady && userId) {
      fetchArousalLevels();
    }
  }, [isAuthReady, userId, fetchArousalLevels]);

  const logArousalLevel = useCallback(async () => {
    if (!isAuthReady || !userId) return;
    const colRef = getArousalCollectionRef();
    if (!colRef) return;
    try {
      const q = query(colRef, orderBy('timestamp', 'desc'), limit(1));
      const snap = await getDocs(q);
      const now = new Date();
      if (snap.docs.length > 0) {
        const last = snap.docs[0].data();
        const lastDate = last.timestamp?.toDate ? last.timestamp.toDate() : null;
        if (lastDate && (now - lastDate) < AR0USAL_INTERVAL_HOURS * 3600 * 1000) {
          setArousalMessage(`You can only log once every ${AR0USAL_INTERVAL_HOURS} hours.`);
          setTimeout(() => setArousalMessage(''), 3000);
          return;
        }
      }
      await addDoc(colRef, {
        level: Number(newArousalLevel),
        notes: newArousalNotes.trim(),
        timestamp: serverTimestamp()
      });
      setArousalMessage('Arousal level logged!');
      setNewArousalNotes('');
      setNewArousalLevel(5);
      fetchArousalLevels();
    } catch (err) {
      console.error('Error logging arousal level:', err);
      setArousalMessage('Failed to log.');
    }
    setTimeout(() => setArousalMessage(''), 3000);
  }, [isAuthReady, userId, getArousalCollectionRef, newArousalLevel, newArousalNotes, fetchArousalLevels]);

  return {
    arousalLevels,
    isLoadingArousal,
    arousalMessage,
    newArousalLevel,
    setNewArousalLevel,
    newArousalNotes,
    setNewArousalNotes,
    logArousalLevel,
    fetchArousalLevels
  };
};
