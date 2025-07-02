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
        await addTask({
          ...taskData,
          recurrenceId: taskData.recurrenceId || null, // This is the fix
          status: 'pending',
          assignedBy: 'keyholder',
          createdAt: serverTimestamp()
        });
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

      if (task.recurrenceDays && task.recurrenceDays > 0 && !task.recurrenceCancelled) {
        const baseDate = task.deadline ? new Date(task.deadline) : new Date();
        const nextDeadline = new Date(baseDate.getTime() + task.recurrenceDays * 86400000);
        if (!task.recurrenceEnd || nextDeadline <= new Date(task.recurrenceEnd)) {
          await addTask({
            text: task.text,
            deadline: nextDeadline,
            recurrenceDays: task.recurrenceDays,
            recurrenceEnd: task.recurrenceEnd ? new Date(task.recurrenceEnd) : null,
            recurrenceId: task.recurrenceId,
            recurrenceCancelled: false,
            reward: task.reward,
            punishment: task.punishment,
            status: 'pending',
            assignedBy: 'keyholder',
            createdAt: serverTimestamp()
          });
        }
      }
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

      if (task.recurrenceDays && task.recurrenceDays > 0 && !task.recurrenceCancelled) {
        const baseDate = task.deadline ? new Date(task.deadline) : new Date();
        const nextDeadline = new Date(baseDate.getTime() + task.recurrenceDays * 86400000);
        if (!task.recurrenceEnd || nextDeadline <= new Date(task.recurrenceEnd)) {
          await addTask({
            text: task.text,
            deadline: nextDeadline,
            recurrenceDays: task.recurrenceDays,
            recurrenceEnd: task.recurrenceEnd ? new Date(task.recurrenceEnd) : null,
            recurrenceId: task.recurrenceId,
            recurrenceCancelled: false,
            reward: task.reward,
            punishment: task.punishment,
            status: 'pending',
            assignedBy: 'keyholder',
            createdAt: serverTimestamp()
          });
        }
      }
    },
    [userId, updateTask, addTask, tasks, requiredKeyholderDurationSeconds, saveDataToFirestore]
  );

  const handleCancelRecurringTask = useCallback(
    async (recurrenceId) => {
      if (!recurrenceId || !tasks || !updateTask) return;
      const related = tasks.filter(
        (t) => t.recurrenceId === recurrenceId && !t.recurrenceCancelled
      );
      for (const t of related) {
        await updateTask(t.id, { recurrenceCancelled: true });
      }
    },
    [tasks, updateTask]
  );

  return {
    handleLockKeyholderControls,
    handleSetRequiredDuration,
    handleAddReward,
    handleAddPunishment,
    handleAddTask,
    handleApproveTask,
    handleRejectTask,
    handleCancelRecurringTask,
  };
}