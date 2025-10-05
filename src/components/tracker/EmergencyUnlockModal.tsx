import React, { useState, useEffect } from "react";
import {
  FaTimes,
  FaExclamationTriangle,
  FaArrowLeft,
  FaArrowRight,
  FaLock,
  FaSpinner,
} from "react-icons/fa";
import type { EmergencyUnlockReason } from "../../types/events";
import { EMERGENCY_UNLOCK_REASONS } from "../../types/events";
import {
  useEmergencyUnlockModal,
  type ModalStage,
} from "../../hooks/tracker/useEmergencyUnlockModal";
import { useAuthState } from "../../contexts";
import { EmergencyPinDBService } from "../../services/database/EmergencyPinDBService";
import { LockCombinationService } from "../../services/database/LockCombinationService";
import { serviceLogger } from "../../utils/logging";

const logger = serviceLogger("EmergencyUnlockModal");

interface EmergencyUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEmergencyUnlock: (
    reason: EmergencyUnlockReason,
    additionalNotes?: string,
  ) => Promise<void>;
  sessionId: string;
  isProcessing?: boolean;
  requirePin?: boolean; // Whether to require PIN validation (for hardcore mode)
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
  requirePin?: boolean;
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
  requirePin,
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
          : requirePin
            ? "Continue to PIN Verification →"
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

// PIN Validation Stage Component (for hardcore mode)
const PinValidationStage: React.FC<{
  userId: string;
  pin: string;
  setPin: (pin: string) => void;
  pinError: string;
  attemptCount: number;
  isValidating: boolean;
  handlePinSubmit: () => Promise<void>;
  setStage: (stage: ModalStage) => void;
}> = ({
  pin,
  setPin,
  pinError,
  attemptCount,
  isValidating,
  handlePinSubmit,
  setStage,
}) => (
  <div>
    <div className="flex items-center mb-6">
      <button
        onClick={() => setStage("confirm")}
        disabled={isValidating}
        className="mr-3 p-1 text-gray-400 hover:text-white transition disabled:opacity-50"
        aria-label="Go back"
      >
        <FaArrowLeft />
      </button>
      <h3 className="text-xl font-bold text-red-300">
        <FaLock className="inline mr-2" />
        PIN Verification Required
      </h3>
    </div>

    <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4 mb-6">
      <p className="text-sm text-yellow-200">
        This session is in <strong>hardcore mode</strong>. Enter your emergency
        PIN to proceed with the unlock.
      </p>
    </div>

    {pinError && (
      <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 mb-4">
        <p className="text-red-400 text-sm">{pinError}</p>
      </div>
    )}

    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Emergency PIN
      </label>
      <input
        type="password"
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        placeholder="Enter your emergency PIN"
        className="w-full p-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 font-mono text-center text-xl tracking-wider"
        disabled={isValidating || attemptCount >= 5}
        autoFocus
        autoComplete="off"
        onKeyDown={(e) => {
          if (e.key === "Enter" && pin && !isValidating) {
            handlePinSubmit();
          }
        }}
      />
      <p className="text-xs text-gray-400 mt-2 text-center">
        Attempts: {attemptCount}/5
      </p>
    </div>

    <div className="flex flex-col space-y-3">
      <button
        onClick={handlePinSubmit}
        disabled={!pin || isValidating || attemptCount >= 5}
        className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center"
      >
        {isValidating ? (
          <>
            <FaSpinner className="animate-spin mr-2" />
            Validating PIN...
          </>
        ) : (
          "🚨 VERIFY & UNLOCK 🚨"
        )}
      </button>
      <button
        onClick={() => setStage("confirm")}
        disabled={isValidating}
        className="w-full bg-gray-600 hover:bg-gray-500 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition"
      >
        Back
      </button>
    </div>

    <p className="text-xs text-gray-400 mt-4 text-center">
      Forgot your PIN? Contact support or check your account recovery options.
    </p>
  </div>
);

// Lock Combination Display Stage
const LockCombinationDisplay: React.FC<{
  combination: string;
  onContinue: () => void;
}> = ({ combination, onContinue }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(combination);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      logger.error("Failed to copy combination to clipboard", {
        error: error as Error,
      });
    }
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <h3 className="text-xl font-bold text-red-300 mb-2">
          🔓 Lock Combination Retrieved
        </h3>
        <p className="text-sm text-gray-300">
          Your saved lock combination is displayed below.
        </p>
      </div>

      <div className="bg-green-900/20 border border-green-600 rounded-lg p-6 mb-6">
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-2">Your Lock Combination:</p>
          <div className="bg-black/40 rounded-lg p-6 mb-4">
            <p className="text-3xl font-mono font-bold text-green-400 tracking-widest">
              {combination}
            </p>
          </div>
          <button
            onClick={handleCopy}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition-colors flex items-center justify-center gap-2"
          >
            {copied ? <>✓ Copied!</> : <>📋 Copy to Clipboard</>}
          </button>
        </div>
      </div>

      <div className="bg-yellow-900/20 border border-yellow-600 rounded p-4 mb-6">
        <p className="text-xs text-yellow-300">
          <strong>Note:</strong> Write this down if needed. Your session will
          end when you click "Complete Unlock" below.
        </p>
      </div>

      <button
        onClick={onContinue}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
      >
        Complete Unlock & End Session
      </button>
    </div>
  );
};

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

  // Handle PIN submission
  const handlePinSubmit = async () => {
    if (!user?.uid || !pin) return;

    setPinError("");
    setIsValidatingPin(true);

    try {
      const isValid = await EmergencyPinDBService.validatePin(user.uid, pin);

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
        const combination = await LockCombinationService.getCombination(
          user.uid,
          sessionId,
          pin,
        );

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

  // Override handleEmergencyUnlock to redirect to PIN stage if needed
  const handleEmergencyUnlock = () => {
    if (requirePin && pinStage !== "pin_validated") {
      setPinStage("pin_required");
    } else {
      originalHandleUnlock();
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
