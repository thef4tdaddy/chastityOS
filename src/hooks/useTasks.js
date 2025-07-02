import { useState, useEffect, useCallback } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

export function useTasks(userId, isAuthReady) {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const getTasksCollectionRef = useCallback(() => {
    if (!userId) return null;
    return collection(db, 'users', userId, 'tasks');
  }, [userId]);

  useEffect(() => {
    if (!isAuthReady || !userId) {
      setIsLoading(false);
      setTasks([]);
      return;
    }

    const tasksCollectionRef = getTasksCollectionRef();
    if (!tasksCollectionRef) return;

    setIsLoading(true);
    const q = query(tasksCollectionRef);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const tasksData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          const normalizedStatus =
            typeof data.status === 'string'
              ? data.status.trim().toLowerCase()
              : undefined;
          return {
            id: doc.id,
            ...data,
            status: normalizedStatus || 'pending',
            deadline: data.deadline && typeof data.deadline.toDate === 'function'
              ? data.deadline.toDate()
              : null,
            recurrenceEnd: data.recurrenceEnd && typeof data.recurrenceEnd.toDate === 'function'
              ? data.recurrenceEnd.toDate()
            : null,
          createdAt: data.createdAt && typeof data.createdAt.toDate === 'function'
            ? data.createdAt.toDate()
            : null,
          submittedAt: data.submittedAt && typeof data.submittedAt.toDate === 'function'
            ? data.submittedAt.toDate()
            : null
        };
      });
      
      setTasks(tasksData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching tasks:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isAuthReady, userId, getTasksCollectionRef]);

  const addTask = useCallback(async (taskData) => {
    const tasksCollectionRef = getTasksCollectionRef();
    if (!tasksCollectionRef) return;
    try {
      await addDoc(tasksCollectionRef, taskData);
    } catch (error) {
      console.error("Error adding task to Firestore:", error);
    }
  }, [getTasksCollectionRef]);

  const updateTask = useCallback(async (taskId, updates) => {
    const tasksCollectionRef = getTasksCollectionRef();
    if (!tasksCollectionRef) return;
    try {
      const taskDocRef = doc(tasksCollectionRef, taskId);
      await updateDoc(taskDocRef, updates);
    } catch (error) {
      console.error("Error updating task:", error);
    }
  }, [getTasksCollectionRef]);

  const deleteTask = useCallback(async (taskId) => {
    const tasksCollectionRef = getTasksCollectionRef();
    if (!tasksCollectionRef) return;
    try {
      const taskDocRef = doc(tasksCollectionRef, taskId);
      await deleteDoc(taskDocRef);
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  }, [getTasksCollectionRef]);

  return { tasks, isLoading, addTask, updateTask, deleteTask };
}