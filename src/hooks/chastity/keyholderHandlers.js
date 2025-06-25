import { useCallback } from 'react';
import { serverTimestamp } from 'firebase/firestore';

export function useKeyholderHandlers({
  userId,
  addTask,
  updateTask,
  saveDataToFirestore,
  requiredKeyholderDurationSeconds,
}) {
  const handleLockKeyholderControls = useCallback(async () => {
    if (!saveDataToFirestore) return;
    await saveDataToFirestore({ isKeyholderControlsLocked: true });
  }, [saveDataToFirestore]);

  const handleSetRequiredDuration = useCallback(
    async (duration) => {
      if (!saveDataToFirestore) {
        console.error("saveDataToFirestore function is not available.");
        return;
      }
      await saveDataToFirestore({ requiredKeyholderDurationSeconds: duration });
    },
    [saveDataToFirestore]
  );

  const handleAddReward = useCallback(
    async (reward) => {
      if (!saveDataToFirestore) return;
      
      const timeToRemoveInSeconds = reward.timeSeconds || 0;
      const currentDuration = requiredKeyholderDurationSeconds || 0;
      const newDuration = Math.max(0, currentDuration - timeToRemoveInSeconds);
      
      await saveDataToFirestore({ requiredKeyholderDurationSeconds: newDuration });
      
      if (userId && addTask) {
        await addTask({ ...reward, type: 'reward', assignedBy: 'keyholder', createdAt: serverTimestamp() });
      }
    },
    [userId, addTask, saveDataToFirestore, requiredKeyholderDurationSeconds]
  );

  const handleAddPunishment = useCallback(
    async (punishment) => {
      if (!saveDataToFirestore) return;

      const timeToAddInSeconds = punishment.timeSeconds || 0;
      const currentDuration = requiredKeyholderDurationSeconds || 0;
      const newDuration = currentDuration + timeToAddInSeconds;
      
      await saveDataToFirestore({ requiredKeyholderDurationSeconds: newDuration });

      if (userId && addTask) {
        await addTask({ ...punishment, type: 'punishment', assignedBy: 'keyholder', createdAt: serverTimestamp() });
      }
    },
    [userId, addTask, saveDataToFirestore, requiredKeyholderDurationSeconds]
  );

  // --- Handler for the Add Task Form ---
  const handleAddTask = useCallback(
    async (taskData) => {
      if (userId && addTask) {
        await addTask({
          ...taskData,
          status: 'pending',
          assignedBy: 'keyholder',
          createdAt: serverTimestamp(),
        });
      }
    },
    [userId, addTask]
  );

  // --- Handlers for Task Approval ---
  const handleApproveTask = useCallback(
    async (taskId) => {
      if (userId && updateTask) {
        await updateTask(taskId, { status: 'approved' });
      }
    },
    [userId, updateTask]
  );

  const handleRejectTask = useCallback(
    async (taskId) => {
      if (userId && updateTask) {
        await updateTask(taskId, { status: 'rejected' });
      }
    },
    [userId, updateTask]
  );

  // --- Return all available actions ---
  return {
    handleLockKeyholderControls,
    handleSetRequiredDuration,
    handleAddReward,
    handleAddPunishment,
    handleAddTask,
    handleApproveTask,
    handleRejectTask,
  };
}