import { useState, useEffect, useCallback } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export function useReleaseRequests(userId, isAuthReady) {
  const [releaseRequests, setReleaseRequests] = useState([]);

  const getCollectionRef = useCallback(() => {
    if (!userId) return null;
    return collection(db, 'users', userId, 'releaseRequests');
  }, [userId]);

  useEffect(() => {
    if (!isAuthReady || !userId) {
      setReleaseRequests([]);
      return;
    }

    const colRef = getCollectionRef();
    if (!colRef) return;

    const q = query(colRef);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => {
        const item = d.data();
        return {
          id: d.id,
          ...item,
          submittedAt: item.submittedAt && typeof item.submittedAt.toDate === 'function'
            ? item.submittedAt.toDate()
            : null,
        };
      });
      setReleaseRequests(data);
    }, (error) => {
      console.error('Error fetching release requests:', error);
    });

    return () => unsubscribe();
  }, [isAuthReady, userId, getCollectionRef]);

  const addReleaseRequest = useCallback(async () => {
    const colRef = getCollectionRef();
    if (!colRef) return;
    try {
      await addDoc(colRef, { status: 'pending', submittedAt: serverTimestamp() });
    } catch (error) {
      console.error('Error adding release request:', error);
    }
  }, [getCollectionRef]);

  const updateReleaseRequest = useCallback(async (id, updates) => {
    const colRef = getCollectionRef();
    if (!colRef) return;
    try {
      const docRef = doc(colRef, id);
      await updateDoc(docRef, updates);
    } catch (error) {
      console.error('Error updating release request:', error);
    }
  }, [getCollectionRef]);

  const deleteReleaseRequest = useCallback(async (id) => {
    const colRef = getCollectionRef();
    if (!colRef) return;
    try {
      const docRef = doc(colRef, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting release request:', error);
    }
  }, [getCollectionRef]);

  return { releaseRequests, addReleaseRequest, updateReleaseRequest, deleteReleaseRequest };
}
