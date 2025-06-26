import { useCallback } from 'react';
import { serverTimestamp } from 'firebase/firestore';

export function useKeyholderHandlers({
  userId,
  tasks,
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
      if (!saveDataToFirestore) return;
      await saveDataToFirestore({ requiredKeyholderDurationSeconds: duration });
    },
    [saveDataToFirestore]
  );

  // Updated to create a standardized log entry
  const handleAddReward = useCallback(
    async (reward) => {
      if (!saveDataToFirestore || !userId || !addTask) return;
      
      const timeToRemoveInSeconds = reward.timeSeconds || 0;
      if (timeToRemoveInSeconds > 0) {
        const currentDuration = requiredKeyholderDurationSeconds || 0;
        const newDuration = Math.max(0, currentDuration - timeToRemoveInSeconds);
        await saveDataToFirestore({ requiredKeyholderDurationSeconds: newDuration });
      }
      
      // Create the standardized log entry
      await addTask({
        logType: 'reward',
        sourceText: 'Manually added by Keyholder',
        note: reward.other || '',
        timeChangeSeconds: timeToRemoveInSeconds > 0 ? -timeToRemoveInSeconds : 0,
        createdAt: serverTimestamp(),
      });
    },
    [userId, addTask, saveDataToFirestore, requiredKeyholderDurationSeconds]
  );

  // Updated to create a standardized log entry
  const handleAddPunishment = useCallback(
    async (punishment) => {
      if (!saveDataToFirestore || !userId || !addTask) return;

      const timeToAddInSeconds = punishment.timeSeconds || 0;
      if (timeToAddInSeconds > 0) {
        const currentDuration = requiredKeyholderDurationSeconds || 0;
        const newDuration = currentDuration + timeToAddInSeconds;
        await saveDataToFirestore({ requiredKeyholderDurationSeconds: newDuration });
      }
      
      // Create the standardized log entry
      await addTask({
        logType: 'punishment',
        sourceText: 'Manually added by Keyholder',
        note: punishment.other || '',
        timeChangeSeconds: timeToAddInSeconds,
        createdAt: serverTimestamp(),
      });
    },
    [userId, addTask, saveDataToFirestore, requiredKeyholderDurationSeconds]
  );

  const handleAddTask = useCallback(
    async (taskData) => {
      if (userId && addTask) {
        await addTask({ ...taskData, status: 'pending', assignedBy: 'keyholder', createdAt: serverTimestamp() });
      }
    },
    [userId, addTask]
  );

  // Updated to automatically log the reward
  const handleApproveTask = useCallback(
    async (taskId) => {
      if (!userId || !updateTask || !tasks) return;
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const timeChange = (task.reward && task.reward.type === 'time') ? task.reward.value : 0;
      if (timeChange > 0) {
        const currentDuration = requiredKeyholderDurationSeconds || 0;
        const newDuration = Math.max(0, currentDuration - timeChange);
        await saveDataToFirestore({ requiredKeyholderDurationSeconds: newDuration });
      }

      // Add a new log entry for the reward
      await addTask({
        logType: 'reward',
        sourceText: `Task: "${task.text}"`,
        note: (task.reward && task.reward.type === 'note') ? task.reward.value : '',
        timeChangeSeconds: -timeChange,
        createdAt: serverTimestamp(),
      });
      
      await updateTask(taskId, { status: 'approved' });
    },
    [userId, updateTask, addTask, tasks, requiredKeyholderDurationSeconds, saveDataToFirestore]
  );

  // Updated to automatically log the punishment
  const handleRejectTask = useCallback(
    async (taskId) => {
      if (!userId || !updateTask || !tasks) return;
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const timeChange = (task.punishment && task.punishment.type === 'time') ? task.punishment.value : 0;
      if (timeChange > 0) {
        const currentDuration = requiredKeyholderDurationSeconds || 0;
        const newDuration = currentDuration + timeChange;
        await saveDataToFirestore({ requiredKeyholderDurationSeconds: newDuration });
      }
      
      // Add a new log entry for the punishment
      await addTask({
        logType: 'punishment',
        sourceText: `Task: "${task.text}"`,
        note: (task.punishment && task.punishment.type === 'note') ? task.punishment.value : '',
        timeChangeSeconds: timeChange,
        createdAt: serverTimestamp(),
      });

      await updateTask(taskId, { status: 'rejected' });
    },
    [userId, updateTask, addTask, tasks, requiredKeyholderDurationSeconds, saveDataToFirestore]
  );

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