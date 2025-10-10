/**
 * Emergency Unlock Modal - Main Component
 * Handles emergency unlock flow for chastity sessions
 * Split into multiple stage components for maintainability
 */
import React from "react";
import { FaTimes } from "../../../utils/iconImport";
import type { EmergencyUnlockReason } from "../../../types/events";
import { useEmergencyUnlockModal } from "../../../hooks/tracker/useEmergencyUnlockModal";
import { useAuthState } from "../../../contexts";
import type { EmergencyUnlockModalProps } from "./types";
import { WarningStage } from "./WarningStage";
import { ReasonStage } from "./ReasonStage";
import { ConfirmationStage } from "./ConfirmationStage";
import { PinValidationStage } from "./PinValidationStage";
import { LockCombinationDisplay } from "./LockCombinationDisplay";
import { usePinValidation } from "./usePinValidation";

export const EmergencyUnlockModal: React.FC<EmergencyUnlockModalProps> = ({
  isOpen,
  onClose,
  onEmergencyUnlock,
  sessionId,
  isProcessing: _isProcessing = false,
  requirePin = false,
}) => {
  const { user } = useAuthState();

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
      if (requirePin && pinStage !== "pin_validated") {
        setPinStage("pin_required");
        return;
      }

      await onEmergencyUnlock(finalReason, additionalNotes);
      onClose();
    },
    isOpen,
  });

  const {
    pin,
    setPin,
    pinError,
    attemptCount,
    isValidatingPin,
    pinStage,
    setPinStage,
    lockCombination,
    handlePinSubmit,
  } = usePinValidation({
    userId: user?.uid,
    sessionId,
    isOpen,
    requirePin,
    getReason: () => reason,
    getCustomReason: () => customReason,
    onEmergencyUnlock,
    onClose,
  });

  const handleEmergencyUnlock = async () => {
    await originalHandleUnlock();
  };

  if (!isOpen) return null;

  // Show PIN validation stage if required and not yet validated
  const showPinStage = requirePin && pinStage === "pin_required";

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 max-w-md w-full rounded-xl border-2 border-red-500 shadow-2xl">
        <div className="relative p-6">
          <Button
            onClick={onClose}
            disabled={isSubmitting || isValidatingPin}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors disabled:cursor-not-allowed"
            aria-label="Close modal"
          >
            <FaTimes size={20} />
          </Button>

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
