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
    // DEBUG: Log the exact path we are querying
    console.log(`[DEBUG] Setting up listener for tasks at: /users/${userId}/tasks`);

    const q = query(tasksCollectionRef);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const tasksData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // DEBUG: Log the raw data coming from Firestore
      console.log("[DEBUG] useTasks: Snapshot received. Raw data:", tasksData);
      
      setTasks(tasksData);
      setIsLoading(false);
    }, (error) => {
      console.error("[DEBUG] useTasks: Error fetching tasks snapshot:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isAuthReady, userId, getTasksCollectionRef]);

  const addTask = useCallback(async (taskData) => {
    const tasksCollectionRef = getTasksCollectionRef();
    if (!tasksCollectionRef) {
      console.error("[Debug] addTask failed: No collection reference available.");
      return;
    }
    console.log("[Debug] Attempting to add task:", taskData);
    try {
      const docRef = await addDoc(tasksCollectionRef, taskData);
      console.log("[Debug] Task added successfully with ID:", docRef.id);
    } catch (error) {
      console.error("[Debug] Error adding task to Firestore:", error);
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