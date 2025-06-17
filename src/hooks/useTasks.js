// src/hooks/useTasks.js
import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

// This hook now manages the entire lifecycle of a task:
// pending -> submitted -> completed / failed
export const useTasks = (userId, isAuthReady) => {
  const [tasks, setTasks] = useState([]);

  // Fetch tasks from Firestore when the user is ready
  useEffect(() => {
    if (!isAuthReady || !userId) return;

    const docRef = doc(db, "users", userId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Ensure tasks is always an array, providing a fallback
        setTasks(data.tasks || []);
      }
    });

    return () => unsubscribe();
  }, [isAuthReady, userId]);

  // Central function to save any updates to the tasks array to Firestore
  const saveTasksToFirestore = useCallback(async (updatedTasks) => {
    if (!isAuthReady || !userId) return;
    const docRef = doc(db, "users", userId);
    try {
      await updateDoc(docRef, { tasks: updatedTasks });
    } catch (error) {
      console.error("Error saving tasks to Firestore:", error);
    }
  }, [isAuthReady, userId]);

  // --- Task Management Functions ---

  // Called by KeyholderSection to create a new task.
  const handleAddTask = useCallback(async (taskText) => {
    if (!taskText.trim()) return;
    const newTask = {
      id: crypto.randomUUID(),
      text: taskText.trim(),
      status: 'pending', // Initial status
      consequence: null,
      createdAt: new Date().toISOString(),
    };
    const updatedTasks = [...tasks, newTask];
    await saveTasksToFirestore(updatedTasks);
  }, [tasks, saveTasksToFirestore]);

  // Called by TasksPage when the submissive completes a task.
  const handleSubmitForReview = useCallback(async (taskId) => {
    const updatedTasks = tasks.map((task) =>
      task.id === taskId ? { ...task, status: 'submitted' } : task
    );
    await saveTasksToFirestore(updatedTasks);
  }, [tasks, saveTasksToFirestore]);
  
  // Called by KeyholderSection to approve a submitted task.
  const handleApproveTask = useCallback(async (taskId) => {
    // In the future, this could open a modal for a custom reward.
    const reward = { type: 'reward', timeSeconds: 3600, other: 'Task Approved' };
    const updatedTasks = tasks.map((task) =>
      task.id === taskId ? { ...task, status: 'completed', consequence: reward } : task
    );
    await saveTasksToFirestore(updatedTasks);
  }, [tasks, saveTasksToFirestore]);

  // Called by KeyholderSection to reject a submitted task.
  const handleRejectTask = useCallback(async (taskId) => {
    // In the future, this could open a modal for a custom punishment.
    const punishment = { type: 'punishment', timeSeconds: 7200, other: 'Task Rejected' };
     const updatedTasks = tasks.map((task) =>
      task.id === taskId ? { ...task, status: 'failed', consequence: punishment } : task
    );
    await saveTasksToFirestore(updatedTasks);
  }, [tasks, saveTasksToFirestore]);

  // Deletes a task that is still pending (hasn't been submitted).
  // This is a safety valve in case a task was made in error.
  const handleDeleteTask = useCallback(async (taskId) => {
    const taskToDelete = tasks.find(t => t.id === taskId);
    if (taskToDelete && taskToDelete.status === 'pending') {
        const updatedTasks = tasks.filter((task) => task.id !== taskId);
        await saveTasksToFirestore(updatedTasks);
    } else {
        console.log("Cannot delete a task that has already been submitted or completed.");
    }
  }, [tasks, saveTasksToFirestore]);


  // Return all the state and functions needed by the components
  return {
    tasks,
    handleAddTask,
    handleSubmitForReview,
    handleApproveTask,
    handleRejectTask,
    handleDeleteTask,
  };
};
