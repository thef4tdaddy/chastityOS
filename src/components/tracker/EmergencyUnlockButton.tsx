import React, { useState } from "react";
import { FaExclamationTriangle } from "react-icons/fa";
import { EmergencyUnlockModal } from "./EmergencyUnlockModal";
import { emergencyService } from "../../services/database/EmergencyService";
import type { EmergencyUnlockReason } from "../../types/events";

interface EmergencyUnlockButtonProps {
  sessionId: string;
  userId: string;
  className?: string;
  onEmergencyUnlock?: () => void;
}

export const EmergencyUnlockButton: React.FC<EmergencyUnlockButtonProps> = ({
  sessionId,
  userId,
  className = "",
  onEmergencyUnlock,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleEmergencyUnlock = async (
    reason: EmergencyUnlockReason,
    additionalNotes?: string,
  ) => {
    setIsProcessing(true);

    try {
      const result = await emergencyService.performEmergencyUnlock({
        sessionId,
        userId,
        reason,
        additionalNotes,
      });

      if (result.success) {
        // Notify parent component that emergency unlock was successful
        onEmergencyUnlock?.();
        setShowModal(false);
      } else {
        // Handle error - could show toast notification or error state
        console.error("Emergency unlock failed:", result.message);
        alert(`Emergency unlock failed: ${result.message}`);
      }
    } catch (error) {
      console.error("Emergency unlock error:", error);
      alert("An unexpected error occurred during emergency unlock.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        disabled={isProcessing}
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
        isProcessing={isProcessing}
      />
    </>
  );
};
