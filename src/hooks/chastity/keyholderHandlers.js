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
      const currentDuration = requiredKeyholderDurationSeconds || 0;
      const newDuration = Math.max(0, currentDuration - timeToRemoveInSeconds);
      
      await saveDataToFirestore({ requiredKeyholderDurationSeconds: newDuration });
      
      // Fix: The 'text' property is no longer auto-generated.
      // It will only save the note from the 'other' input field.
      if (userId && addTask) {
        await addTask({ ...reward, type: 'reward', assignedBy: 'keyholder', createdAt: serverTimestamp() });
      }
    },
    [userId, addTask, saveDataToFirestore, requiredKeyholderDurationSeconds]
  );

  // This function now ADDS time to the required duration.
  const handleAddPunishment = useCallback(
    async (punishment) => {
      if (!saveDataToFirestore) return;

      const timeToAddInSeconds = punishment.timeSeconds || 0;
      const currentDuration = requiredKeyholderDurationSeconds || 0;
      const newDuration = currentDuration + timeToAddInSeconds;
      
      await saveDataToFirestore({ requiredKeyholderDurationSeconds: newDuration });

      // Fix: The 'text' property is no longer auto-generated.
      // It will only save the note from the 'other' input field.
      if (userId && addTask) {
        await addTask({ ...punishment, type: 'punishment', assignedBy: 'keyholder', createdAt: serverTimestamp() });
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
