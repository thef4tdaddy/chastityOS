import { useState, useCallback } from "react";
import { sha256, generateBackupCode } from "../utils/hash";
import { logEvent } from "../utils/logging";
import { eventTypes } from "../utils/eventTypes";

/**
 * Manages the state and logic for the user's personal chastity goal.
 * @param {object} props - The props for the hook.
 * @param {string} props.userId - The ID of the current user.
 * @param {object} props.settings - The user's current settings object.
 * @param {function} props.setSettings - The function to update the user's settings.
 * @param {object} props.session - The user's current session object.
 */
export const usePersonalGoal = ({ userId, settings, setSettings, session }) => {
  const [goalDuration, setGoalDuration] = useState(7);
  const [isSelfLocking, setIsSelfLocking] = useState(false);
  const [selfLockCodeInput, setSelfLockCodeInput] = useState("");
  const [generatedBackupCode, setGeneratedBackupCode] = useState(null);
  const [goalError, setGoalError] = useState(null);

  // Check if a Keyholder lock is active by seeing if a required duration is set.
  const isKhLocked = session?.requiredKeyholderDurationSeconds > 0;

  const handleSetPersonalGoal = useCallback(async () => {
    // Prevent setting a goal if a KH lock is active.
    if (isKhLocked) {
      setGoalError(
        "Personal goals are disabled while a Keyholder lock is active.",
      );
      return;
    }

    setGoalError(null);
    if (!userId) {
      setGoalError("User not authenticated.");
      return;
    }
    if (!goalDuration || goalDuration <= 0) {
      setGoalError("Please enter a valid duration for the goal.");
      return;
    }
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + parseInt(goalDuration, 10));

    let backupCodeHash = null;
    let hashedSelfLockCode = null;

    if (isSelfLocking) {
      const backupCode = generateBackupCode();
      backupCodeHash = await sha256(backupCode);
      setGeneratedBackupCode(backupCode);
      if (selfLockCodeInput) {
        hashedSelfLockCode = await sha256(selfLockCodeInput);
      }
    }

    setSettings((prev) => ({
      ...prev,
      isGoalActive: true,
      isGoalCompleted: false,
      goalDuration: parseInt(goalDuration, 10),
      goalEndDate: endDate.toISOString(),
      isHardcoreGoal: isSelfLocking,
      goalBackupCodeHash: backupCodeHash,
      hashedSelfLockCode: hashedSelfLockCode,
      revealedSelfLockCode: null,
    }));

    logEvent(userId, eventTypes.PERSONAL_GOAL_SET.type, {
      duration: goalDuration,
      isHardcore: isSelfLocking,
    });
  }, [
    userId,
    goalDuration,
    isSelfLocking,
    selfLockCodeInput,
    setSettings,
    isKhLocked,
  ]);

  const handleClearPersonalGoal = useCallback(
    async (backupCode = "") => {
      // Prevent clearing a goal if a KH lock is active.
      if (isKhLocked) {
        setGoalError(
          "Personal goals are disabled while a Keyholder lock is active.",
        );
        return;
      }

      setGoalError(null);
      if (!userId) {
        setGoalError("User not authenticated.");
        return;
      }

      const isHardcore = settings?.isHardcoreGoal;
      const storedBackupHash = settings?.goalBackupCodeHash;
      const isCompleted = settings?.isGoalCompleted;

      if (isHardcore && !isCompleted) {
        if (!backupCode) {
          const msg =
            "This is a hardcore goal. A backup code is required to unlock early.";
          setGoalError(msg);
          return;
        }
        const inputBackupCodeHash = await sha256(backupCode);
        if (inputBackupCodeHash !== storedBackupHash) {
          const msg = "Incorrect backup code.";
          setGoalError(msg);
          return;
        }
      }

      setSettings((prev) => ({
        ...prev,
        isGoalActive: false,
        isGoalCompleted: false,
        goalDuration: 0,
        goalEndDate: null,
        isHardcoreGoal: false,
        goalBackupCodeHash: null,
        hashedSelfLockCode: null,
        revealedSelfLockCode: null,
      }));

      logEvent(userId, eventTypes.PERSONAL_GOAL_REMOVED.type, {
        wasCompleted: isCompleted,
      });
    },
    [userId, settings, setSettings, isKhLocked],
  );

  return {
    goalDuration,
    setGoalDuration,
    isSelfLocking,
    setIsSelfLocking,
    selfLockCodeInput,
    setSelfLockCodeInput,
    handleSetPersonalGoal,
    handleClearPersonalGoal,
    generatedBackupCode,
    setGeneratedBackupCode,
    goalError,
    isGoalActive: settings?.isGoalActive,
    isGoalCompleted: settings?.isGoalCompleted,
    isHardcoreGoal: settings?.isHardcoreGoal,
    goalEndDate: settings?.goalEndDate,
    revealedSelfLockCode: settings?.revealedSelfLockCode,
    isKhLocked, // Export the lock status for the UI to use.
  };
};
