import { useCallback } from 'react';
import { serverTimestamp } from 'firebase/firestore';

// This hook is now correctly aligned with your application's data structure.
// It uses the saveDataToFirestore function from your useChastitySession hook.
export function useKeyholderHandlers({
  userId,
  addTask,
  saveDataToFirestore,
  // This prop is now used to read the current duration for calculations
  requiredKeyholderDurationSeconds,
}) {
  const handleLockKeyholderControls = useCallback(async () => {
    if (!saveDataToFirestore) return;
    await saveDataToFirestore({ isKeyholderControlsLocked: true });
  }, [saveDataToFirestore]);

  // This function sets the base duration, like a "hardcore personal goal".
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

  // This function now SUBTRACTS time from the required duration.
  const handleAddReward = useCallback(
    async (reward) => {
      if (!saveDataToFirestore) return;
      
      const timeToRemoveInSeconds = reward.timeSeconds || 0;
      // Calculate the new duration, ensuring it doesn't go below zero.
      const currentDuration = requiredKeyholderDurationSeconds || 0;
      const newDuration = Math.max(0, currentDuration - timeToRemoveInSeconds);
      
      // Save the new, shorter duration to the database.
      await saveDataToFirestore({ requiredKeyholderDurationSeconds: newDuration });
      
      // Optionally, we can still log this as a task for the user's history.
      if (userId && addTask) {
        await addTask({ ...reward, text: reward.other || `Time reduced by ${timeToRemoveInSeconds}s`, type: 'reward', assignedBy: 'keyholder', createdAt: serverTimestamp() });
      }
    },
    [userId, addTask, saveDataToFirestore, requiredKeyholderDurationSeconds]
  );

  // This function now ADDS time to the required duration.
  const handleAddPunishment = useCallback(
    async (punishment) => {
      if (!saveDataToFirestore) return;

      const timeToAddInSeconds = punishment.timeSeconds || 0;
      // Calculate the new duration by adding the punishment time.
      const currentDuration = requiredKeyholderDurationSeconds || 0;
      const newDuration = currentDuration + timeToAddInSeconds;
      
      // Save the new, longer duration to the database.
      await saveDataToFirestore({ requiredKeyholderDurationSeconds: newDuration });

      // Optionally, we can still log this as a task for the user's history.
      if (userId && addTask) {
        await addTask({ ...punishment, text: punishment.other || `Time increased by ${timeToAddInSeconds}s`, type: 'punishment', assignedBy: 'keyholder', createdAt: serverTimestamp() });
      }
    },
    [userId, addTask, saveDataToFirestore, requiredKeyholderDurationSeconds]
  );

  return {
    handleLockKeyholderControls,
    handleSetRequiredDuration,
    handleAddReward,
    handleAddPunishment,
  };
}
