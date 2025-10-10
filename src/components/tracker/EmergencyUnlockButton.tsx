import React, { useState } from "react";
import { FaExclamationTriangle } from "../../utils/iconImport";
import { EmergencyUnlockModal } from "./EmergencyUnlockModal";
import { useEmergencyUnlock } from "../../hooks/api/useEmergency";
import type { EmergencyUnlockReason } from "../../types/events";
import { logger } from "../../utils/logging";

interface EmergencyUnlockButtonProps {
  sessionId: string;
  userId: string;
  className?: string;
  onEmergencyUnlock?: () => void;
  requirePin?: boolean; // Whether to require PIN validation (for hardcore mode)
}

export const EmergencyUnlockButton: React.FC<EmergencyUnlockButtonProps> = ({
  sessionId,
  userId,
  className = "",
  onEmergencyUnlock,
  requirePin = false,
}) => {
  const [showModal, setShowModal] = useState(false);
  const emergencyUnlock = useEmergencyUnlock();

  const handleEmergencyUnlock = async (
    reason: EmergencyUnlockReason,
    additionalNotes?: string,
  ) => {
    try {
      const result = await emergencyUnlock.mutateAsync({
        sessionId,
        userId,
        reason,
        additionalNotes,
      });

      if (result.success) {
        // Notify parent component that emergency unlock was successful
        onEmergencyUnlock?.();
        setShowModal(false);
        logger.info("Emergency unlock completed successfully");
      } else {
        // Error handling with proper logging - no console.error or alert
        logger.error("Emergency unlock failed", {
          error: result.message,
          sessionId,
          userId,
          reason,
        });
      }
    } catch (error) {
      logger.error("Emergency unlock error", {
        error: error instanceof Error ? error.message : String(error),
        sessionId,
        userId,
        reason,
      });
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        disabled={emergencyUnlock.isPending}
        className={`bg-red-500 hover:bg-red-600 disabled:bg-red-400 text-white px-4 py-2 rounded font-medium border-2 border-red-700 transition-colors flex items-center justify-center ${className}`}
        aria-label="Emergency unlock - use only in genuine emergencies"
      >
        <FaExclamationTriangle className="mr-2" />
        🚨 Emergency Unlock
      </button>

      <EmergencyUnlockModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onEmergencyUnlock={handleEmergencyUnlock}
        sessionId={sessionId}
        isProcessing={emergencyUnlock.isPending}
        requirePin={requirePin}
      />
    </>
  );
};
