/**
 * Hook for managing PIN validation in emergency unlock modal
 */
import { useState, useEffect } from "react";
import type { EmergencyUnlockReason } from "../../../types/events";
import { useValidateEmergencyPin } from "../../../hooks/api/useEmergencyPin";
import { useLockCombination } from "../../../hooks/api/useLockCombination";
import {
  validateEmergencyPinAttempt,
  retrieveLockCombination,
} from "../../../utils/emergency/pinValidation";
import { serviceLogger } from "../../../utils/logging";

const logger = serviceLogger("EmergencyUnlockModal");

interface UsePinValidationProps {
  userId?: string;
  sessionId: string;
  isOpen: boolean;
  requirePin: boolean;
  getReason: () => string;
  getCustomReason: () => string;
  onEmergencyUnlock: (
    reason: EmergencyUnlockReason,
    additionalNotes?: string,
  ) => Promise<void>;
  onClose: () => void;
}

export const usePinValidation = ({
  userId,
  sessionId,
  isOpen,
  requirePin,
  getReason,
  getCustomReason,
  onEmergencyUnlock,
  onClose,
}: UsePinValidationProps) => {
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [attemptCount, setAttemptCount] = useState(0);
  const [isValidatingPin, setIsValidatingPin] = useState(false);
  const [pinStage, setPinStage] = useState<
    "normal" | "pin_required" | "pin_validated" | "show_combination"
  >(requirePin ? "pin_required" : "normal");
  const [lockCombination, setLockCombination] = useState<string | null>(null);

  const validatePin = useValidateEmergencyPin();
  const { refetch: fetchLockCombination } = useLockCombination(
    userId,
    sessionId,
    pin,
  );

  const handleUnlockAfterPinValidation = async () => {
    setPin("");
    const reason = getReason();
    const customReason = getCustomReason();
    await onEmergencyUnlock(
      reason as EmergencyUnlockReason,
      customReason || undefined,
    );
    onClose();
  };

  const handleCombinationRetrieval = async () => {
    const combination = await retrieveLockCombination(fetchLockCombination);

    if (combination) {
      setLockCombination(combination);
      setPinStage("show_combination");
      setPin("");
      return true;
    }

    logger.warn("No lock combination found or decryption failed");
    return false;
  };

  const handlePinSubmit = async () => {
    if (!userId || !pin) return;

    setPinError("");
    setIsValidatingPin(true);

    const isValid = await validateEmergencyPinAttempt({
      userId,
      pin,
      attemptCount,
      validatePin: validatePin.mutateAsync,
      onSuccess: async () => {
        setPinStage("pin_validated");
        setAttemptCount(0);

        const hasCombination = await handleCombinationRetrieval();
        if (!hasCombination) {
          await handleUnlockAfterPinValidation();
        }
      },
      onFailure: (error, attempts) => {
        setPinError(error);
        setAttemptCount(attempts);
        setPin("");
      },
      onMaxAttempts: () => {
        setPinError("Too many failed attempts. Modal will close in 5 seconds.");
        setTimeout(() => {
          setAttemptCount(0);
          onClose();
        }, 5000);
      },
    });

    setIsValidatingPin(!isValid ? false : false);
  };

  // Reset PIN state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPin("");
      setPinError("");
      setAttemptCount(0);
      setPinStage(requirePin ? "pin_required" : "normal");
    }
  }, [isOpen, requirePin]);

  return {
    pin,
    setPin,
    pinError,
    setPinError,
    attemptCount,
    isValidatingPin,
    pinStage,
    setPinStage,
    lockCombination,
    handlePinSubmit,
  };
};
