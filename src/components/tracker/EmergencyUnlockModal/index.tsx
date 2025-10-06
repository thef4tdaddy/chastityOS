/**
 * Emergency Unlock Modal - Main Component
 * Handles emergency unlock flow for chastity sessions
 * Split into multiple stage components for maintainability
 */
import React, { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import type { EmergencyUnlockReason } from "../../../types/events";
import { useEmergencyUnlockModal } from "../../../hooks/tracker/useEmergencyUnlockModal";
import { useAuthState } from "../../../contexts";
import { useValidateEmergencyPin } from "../../../hooks/api/useEmergencyPin";
import { useLockCombination } from "../../../hooks/api/useLockCombination";
import { serviceLogger } from "../../../utils/logging";
import type { EmergencyUnlockModalProps } from "./types";
import { WarningStage } from "./WarningStage";
import { ReasonStage } from "./ReasonStage";
import { ConfirmationStage } from "./ConfirmationStage";
import { PinValidationStage } from "./PinValidationStage";
import { LockCombinationDisplay } from "./LockCombinationDisplay";

const logger = serviceLogger("EmergencyUnlockModal");

export const EmergencyUnlockModal: React.FC<EmergencyUnlockModalProps> = ({
  isOpen,
  onClose,
  onEmergencyUnlock,
  sessionId,
  isProcessing: _isProcessing = false,
  requirePin = false,
}) => {
  const { user } = useAuthState();
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [attemptCount, setAttemptCount] = useState(0);
  const [isValidatingPin, setIsValidatingPin] = useState(false);
  const [pinStage, setPinStage] = useState<
    "normal" | "pin_required" | "pin_validated" | "show_combination"
  >(requirePin ? "pin_required" : "normal");
  const [lockCombination, setLockCombination] = useState<string | null>(null);

  // Use TanStack Query hooks
  const validatePin = useValidateEmergencyPin();
  const { refetch: fetchLockCombination } = useLockCombination(
    user?.uid,
    sessionId,
    pin,
  );

  const {
    stage,
    reason,
    customReason,
    confirmText,
    isSubmitting,
    setStage,
    setReason,
    setCustomReason,
    setConfirmText,
    handleEmergencyUnlock: originalHandleUnlock,
    canProceedFromReason,
    canConfirm,
    requiredText,
    confirmInputRef,
  } = useEmergencyUnlockModal({
    sessionId,
    onEmergencyUnlock: async (finalReason, additionalNotes) => {
      // If PIN is required, validate it first
      if (requirePin && pinStage !== "pin_validated") {
        setPinStage("pin_required");
        return;
      }

      await onEmergencyUnlock(finalReason, additionalNotes);
      onClose();
    },
    isOpen,
  });

  // Handle emergency unlock (wrapped to check PIN first)
  const handleEmergencyUnlock = async () => {
    await originalHandleUnlock();
  };

  // Handle PIN submission
  const handlePinSubmit = async () => {
    if (!user?.uid || !pin) return;

    setPinError("");
    setIsValidatingPin(true);

    try {
      const isValid = await validatePin.mutateAsync({
        userId: user.uid,
        pin,
      });

      if (!isValid) {
        setAttemptCount((prev) => prev + 1);
        setPinError(`Invalid PIN. Attempt ${attemptCount + 1}/5`);
        setPin("");

        if (attemptCount >= 4) {
          setPinError(
            "Too many failed attempts. Modal will close in 5 seconds.",
          );
          setTimeout(() => {
            setAttemptCount(0);
            onClose();
          }, 5000);
        }
        return;
      }

      // PIN validated - now try to retrieve lock combination
      setPinStage("pin_validated");
      setAttemptCount(0);

      // Try to retrieve lock combination for this session
      try {
        const { data: combination } = await fetchLockCombination();

        if (combination) {
          // Show the combination to the user
          setLockCombination(combination);
          setPinStage("show_combination");
          setPin(""); // Clear PIN from memory
          return; // Don't unlock yet, let user see combination
        }
      } catch (error) {
        // No combination or decryption failed - that's OK, continue with unlock
        logger.warn("No lock combination found or decryption failed", {
          error: error as Error,
        });
      }

      // No combination saved, proceed with unlock immediately
      setPin("");
      await onEmergencyUnlock(
        reason as EmergencyUnlockReason,
        customReason || undefined,
      );
      onClose();
    } catch {
      setPinError("Failed to validate PIN. Please try again.");
    } finally {
      setIsValidatingPin(false);
    }
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

  if (!isOpen) return null;

  // Show PIN validation stage if required and not yet validated
  const showPinStage = requirePin && pinStage === "pin_required";

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 max-w-md w-full rounded-xl border-2 border-red-500 shadow-2xl">
        <div className="relative p-6">
          <button
            onClick={onClose}
            disabled={isSubmitting || isValidatingPin}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors disabled:cursor-not-allowed"
            aria-label="Close modal"
          >
            <FaTimes size={20} />
          </button>

          {showPinStage ? (
            <PinValidationStage
              userId={user?.uid || ""}
              pin={pin}
              setPin={setPin}
              pinError={pinError}
              attemptCount={attemptCount}
              isValidating={isValidatingPin}
              handlePinSubmit={handlePinSubmit}
              setStage={() => setPinStage("normal")}
            />
          ) : pinStage === "show_combination" && lockCombination ? (
            <LockCombinationDisplay
              combination={lockCombination}
              onContinue={async () => {
                await onEmergencyUnlock(
                  reason as EmergencyUnlockReason,
                  customReason || undefined,
                );
                onClose();
              }}
            />
          ) : (
            <>
              {stage === "warning" && (
                <WarningStage setStage={setStage} onClose={onClose} />
              )}
              {stage === "reason" && (
                <ReasonStage
                  setStage={setStage}
                  reason={reason}
                  setReason={setReason}
                  customReason={customReason}
                  setCustomReason={setCustomReason}
                  canProceedFromReason={canProceedFromReason}
                />
              )}
              {stage === "confirm" && (
                <ConfirmationStage
                  setStage={setStage}
                  sessionId={sessionId}
                  reason={reason}
                  confirmText={confirmText}
                  setConfirmText={setConfirmText}
                  requiredText={requiredText}
                  confirmInputRef={confirmInputRef}
                  handleEmergencyUnlock={handleEmergencyUnlock}
                  canConfirm={canConfirm}
                  isSubmitting={isSubmitting}
                  requirePin={requirePin}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
