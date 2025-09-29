import { useState, useEffect, useRef } from "react";
import type { React } from "react";
import type { EmergencyUnlockReason } from "../../types/events";
import { logger } from "../../utils/logging";

export type ModalStage = "warning" | "reason" | "confirm";

interface UseEmergencyUnlockModalProps {
  sessionId: string;
  onEmergencyUnlock: (
    reason: EmergencyUnlockReason,
    additionalNotes?: string,
  ) => Promise<void>;
  isOpen: boolean;
}

export interface UseEmergencyUnlockModalReturn {
  // State
  stage: ModalStage;
  reason: EmergencyUnlockReason | "";
  customReason: string;
  confirmText: string;
  isSubmitting: boolean;

  // Actions
  setStage: (stage: ModalStage) => void;
  setReason: (reason: EmergencyUnlockReason | "") => void;
  setCustomReason: (reason: string) => void;
  setConfirmText: (text: string) => void;
  handleEmergencyUnlock: () => Promise<void>;
  resetModal: () => void;

  // Computed values
  canProceedFromReason: boolean;
  canConfirm: boolean;
  requiredText: string;
  confirmInputRef: React.RefObject<HTMLInputElement>;
}

export const useEmergencyUnlockModal = ({
  sessionId,
  onEmergencyUnlock,
  isOpen,
}: UseEmergencyUnlockModalProps): UseEmergencyUnlockModalReturn => {
  const [stage, setStage] = useState<ModalStage>("warning");
  const [reason, setReason] = useState<EmergencyUnlockReason | "">("");
  const [customReason, setCustomReason] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const confirmInputRef = useRef<HTMLInputElement>(null);
  const requiredText = "EMERGENCY UNLOCK";

  // Reset state when modal opens/closes
  const resetModal = () => {
    setStage("warning");
    setReason("");
    setCustomReason("");
    setConfirmText("");
    setIsSubmitting(false);
  };

  useEffect(() => {
    if (isOpen) {
      resetModal();
    }
  }, [isOpen]);

  // Focus confirm input when reaching confirm stage
  useEffect(() => {
    if (stage === "confirm" && confirmInputRef.current) {
      confirmInputRef.current.focus();
    }
  }, [stage]);

  const handleEmergencyUnlock = async () => {
    if (!reason || confirmText !== requiredText) return;

    setIsSubmitting(true);
    try {
      const finalReason = reason as EmergencyUnlockReason;
      const additionalNotes = reason === "Other" ? customReason : undefined;
      await onEmergencyUnlock(finalReason, additionalNotes);
    } catch (error) {
      logger.error("Emergency unlock failed in modal", {
        error: error instanceof Error ? error.message : String(error),
        sessionId,
      });
      throw error; // Re-throw to let parent component handle it
    } finally {
      setIsSubmitting(false);
    }
  };

  // Computed values
  const canProceedFromReason = Boolean(
    reason && (reason !== "Other" || customReason.trim()),
  );
  const canConfirm = Boolean(
    confirmText === requiredText && canProceedFromReason,
  );

  return {
    // State
    stage,
    reason,
    customReason,
    confirmText,
    isSubmitting,

    // Actions
    setStage,
    setReason,
    setCustomReason,
    setConfirmText,
    handleEmergencyUnlock,
    resetModal,

    // Computed values
    canProceedFromReason,
    canConfirm,
    requiredText,
    confirmInputRef: confirmInputRef as React.RefObject<HTMLInputElement>,
  };
};
