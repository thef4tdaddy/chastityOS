import React from "react";
import {
  FaTimes,
  FaExclamationTriangle,
  FaArrowLeft,
  FaArrowRight,
} from "react-icons/fa";
import type { EmergencyUnlockReason } from "../../types/events";
import { EMERGENCY_UNLOCK_REASONS } from "../../types/events";
import {
  useEmergencyUnlockModal,
  type ModalStage,
} from "../../hooks/tracker/useEmergencyUnlockModal";

interface EmergencyUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEmergencyUnlock: (
    reason: EmergencyUnlockReason,
    additionalNotes?: string,
  ) => Promise<void>;
  sessionId: string;
  isProcessing?: boolean;
}

// Warning Stage Component
const WarningStage: React.FC<{
  setStage: (stage: ModalStage) => void;
  onClose: () => void;
}> = ({ setStage, onClose }) => (
  <div className="text-center">
    <FaExclamationTriangle className="text-6xl text-red-400 mx-auto mb-6" />
    <h3 className="text-xl font-bold mb-4 text-red-300">🚨 Emergency Unlock</h3>

    <div className="bg-red-900/30 border border-red-600 rounded-lg p-4 mb-6 text-left">
      <h4 className="font-semibold text-red-300 mb-2">
        ⚠️ Warning: Emergency Use Only
      </h4>
      <ul className="text-sm text-red-200 space-y-1">
        <li>• This will immediately end your current session</li>
        <li>• All session goals and restrictions will be bypassed</li>
        <li>• This action will be logged for safety and accountability</li>
        <li>• Frequent use may trigger cooldown periods</li>
        <li>• Use only in genuine emergency situations</li>
      </ul>
    </div>

    <p className="text-sm text-gray-300 mb-6">
      This feature is designed for medical emergencies, safety concerns,
      equipment malfunctions, or other urgent situations that genuinely require
      immediate unlock.
    </p>

    <div className="flex flex-col space-y-3">
      <button
        onClick={() => setStage("reason")}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center"
      >
        I Understand - Continue
        <FaArrowRight className="ml-2" />
      </button>
      <button
        onClick={onClose}
        className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg transition"
      >
        Cancel
      </button>
    </div>
  </div>
);

// Helper to get reason description
const getReasonDescription = (reason: EmergencyUnlockReason): string => {
  const descriptions: Record<EmergencyUnlockReason, string> = {
    "Medical Emergency":
      "Health-related emergencies requiring immediate unlock",
    "Safety Concern": "Physical safety or security situations",
    "Equipment Malfunction": "Device failure or malfunction",
    "Urgent Situation": "Other urgent circumstances requiring unlock",
    Other: "Custom reason with additional details",
  };
  return descriptions[reason] || "";
};

// Reason Selection List Component
const ReasonSelectionList: React.FC<{
  reason: EmergencyUnlockReason | "";
  setReason: (reason: EmergencyUnlockReason | "") => void;
}> = ({ reason, setReason }) => (
  <div className="space-y-3 mb-6">
    {EMERGENCY_UNLOCK_REASONS.map((emergencyReason) => (
      <label
        key={emergencyReason}
        className={`flex items-start p-3 rounded-lg border cursor-pointer transition ${
          reason === emergencyReason
            ? "border-red-500 bg-red-900/30"
            : "border-gray-600 bg-gray-800/50 hover:bg-gray-700/50"
        }`}
      >
        <input
          type="radio"
          name="emergency-reason"
          value={emergencyReason}
          checked={reason === emergencyReason}
          onChange={(e) => setReason(e.target.value as EmergencyUnlockReason)}
          className="mt-1 mr-3 text-red-600"
        />
        <div>
          <div className="font-medium text-white">{emergencyReason}</div>
          <div className="text-xs text-gray-400 mt-1">
            {getReasonDescription(emergencyReason)}
          </div>
        </div>
      </label>
    ))}
  </div>
);

// Reason Stage Component
const ReasonStage: React.FC<{
  setStage: (stage: ModalStage) => void;
  reason: EmergencyUnlockReason | "";
  setReason: (reason: EmergencyUnlockReason | "") => void;
  customReason: string;
  setCustomReason: (reason: string) => void;
  canProceedFromReason: boolean;
}> = ({
  setStage,
  reason,
  setReason,
  customReason,
  setCustomReason,
  canProceedFromReason,
}) => (
  <div>
    <div className="flex items-center mb-6">
      <button
        onClick={() => setStage("warning")}
        className="mr-3 p-1 text-gray-400 hover:text-white transition"
        aria-label="Go back"
      >
        <FaArrowLeft />
      </button>
      <h3 className="text-xl font-bold text-red-300">
        Select Emergency Reason
      </h3>
    </div>

    <p className="text-sm text-gray-300 mb-4">
      Please select the reason for your emergency unlock. This information helps
      ensure the feature is used appropriately and safely.
    </p>

    <ReasonSelectionList reason={reason} setReason={setReason} />

    {reason === "Other" && (
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Please specify the emergency reason:
        </label>
        <textarea
          value={customReason}
          onChange={(e) => setCustomReason(e.target.value)}
          placeholder="Describe your emergency situation..."
          rows={3}
          className="w-full p-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 resize-none"
          maxLength={500}
        />
        <div className="text-xs text-gray-400 mt-1">
          {customReason.length}/500 characters
        </div>
      </div>
    )}

    <div className="flex flex-col space-y-3">
      <button
        onClick={() => setStage("confirm")}
        disabled={!canProceedFromReason}
        className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center"
      >
        Continue to Confirmation
        <FaArrowRight className="ml-2" />
      </button>
      <button
        onClick={() => setStage("warning")}
        className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg transition"
      >
        Back
      </button>
    </div>
  </div>
);

// Final Warning Box Component
const FinalWarningBox: React.FC<{
  sessionId: string;
  reason: EmergencyUnlockReason | "" | null;
}> = ({ sessionId, reason }) => (
  <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4 mb-6">
    <h4 className="font-semibold text-yellow-300 mb-2">⚠️ Final Warning</h4>
    <p className="text-sm text-yellow-200 mb-3">
      You are about to perform an emergency unlock. This action:
    </p>
    <ul className="text-sm text-yellow-200 space-y-1 mb-3">
      <li>• Will immediately end session #{sessionId.slice(-8)}</li>
      <li>• Cannot be undone</li>
      <li>• Will be permanently logged</li>
      <li>
        • Reason: <strong>{reason}</strong>
      </li>
    </ul>
  </div>
);

// Confirmation Input Component
const ConfirmationInput: React.FC<{
  confirmText: string;
  setConfirmText: (text: string) => void;
  requiredText: string;
  confirmInputRef: React.RefObject<HTMLInputElement>;
}> = ({ confirmText, setConfirmText, requiredText, confirmInputRef }) => (
  <div className="mb-6">
    <label className="block text-sm font-medium text-gray-300 mb-2">
      Type "{requiredText}" to confirm:
    </label>
    <input
      ref={confirmInputRef}
      type="text"
      value={confirmText}
      onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
      placeholder={requiredText}
      className={`w-full p-3 rounded-lg border bg-gray-800 text-white text-center font-mono text-lg tracking-widest focus:ring-2 transition ${
        confirmText === requiredText
          ? "border-green-500 focus:ring-green-500"
          : "border-gray-600 focus:ring-red-500"
      }`}
      maxLength={requiredText.length}
    />
    <div className="text-xs text-gray-400 mt-1 text-center">
      {confirmText.length}/{requiredText.length} characters
    </div>
  </div>
);

// Confirmation Stage Component
const ConfirmationStage: React.FC<{
  setStage: (stage: ModalStage) => void;
  sessionId: string;
  reason: EmergencyUnlockReason | "" | null;
  confirmText: string;
  setConfirmText: (text: string) => void;
  requiredText: string;
  confirmInputRef: React.RefObject<HTMLInputElement>;
  handleEmergencyUnlock: () => void;
  canConfirm: boolean;
  isSubmitting: boolean;
}> = ({
  setStage,
  sessionId,
  reason,
  confirmText,
  setConfirmText,
  requiredText,
  confirmInputRef,
  handleEmergencyUnlock,
  canConfirm,
  isSubmitting,
}) => (
  <div>
    <div className="flex items-center mb-6">
      <button
        onClick={() => setStage("reason")}
        className="mr-3 p-1 text-gray-400 hover:text-white transition"
        aria-label="Go back"
      >
        <FaArrowLeft />
      </button>
      <h3 className="text-xl font-bold text-red-300">Final Confirmation</h3>
    </div>

    <FinalWarningBox sessionId={sessionId} reason={reason} />

    <ConfirmationInput
      confirmText={confirmText}
      setConfirmText={setConfirmText}
      requiredText={requiredText}
      confirmInputRef={confirmInputRef}
    />

    <div className="flex flex-col space-y-3">
      <button
        onClick={handleEmergencyUnlock}
        disabled={!canConfirm || isSubmitting}
        className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition"
      >
        {isSubmitting
          ? "Processing Emergency Unlock..."
          : "🚨 EMERGENCY UNLOCK 🚨"}
      </button>
      <button
        onClick={() => setStage("reason")}
        disabled={isSubmitting}
        className="w-full bg-gray-600 hover:bg-gray-500 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition"
      >
        Back to Reason Selection
      </button>
    </div>
  </div>
);

export const EmergencyUnlockModal: React.FC<EmergencyUnlockModalProps> = ({
  isOpen,
  onClose,
  onEmergencyUnlock,
  sessionId,
  isProcessing: _isProcessing = false,
}) => {
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
    handleEmergencyUnlock,
    canProceedFromReason,
    canConfirm,
    requiredText,
    confirmInputRef,
  } = useEmergencyUnlockModal({
    sessionId,
    onEmergencyUnlock: async (finalReason, additionalNotes) => {
      await onEmergencyUnlock(finalReason, additionalNotes);
      onClose();
    },
    isOpen,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 max-w-md w-full rounded-xl border-2 border-red-500 shadow-2xl">
        <div className="relative p-6">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors disabled:cursor-not-allowed"
            aria-label="Close modal"
          >
            <FaTimes size={20} />
          </button>

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
            />
          )}
        </div>
      </div>
    </div>
  );
};
