/**
 * Confirmation Stage Component for Emergency Unlock Modal
 * Final confirmation before emergency unlock
 */
import React from "react";
import { FaArrowLeft } from "react-icons/fa";
import type { EmergencyUnlockReason } from "../../../types/events";
import type { ModalStage } from "./types";
import { Input } from "@/components/ui";

interface FinalWarningBoxProps {
  sessionId: string;
  reason: EmergencyUnlockReason | "" | null;
}

const FinalWarningBox: React.FC<FinalWarningBoxProps> = ({
  sessionId,
  reason,
}) => (
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

interface ConfirmationInputProps {
  confirmText: string;
  setConfirmText: (text: string) => void;
  requiredText: string;
  confirmInputRef: React.RefObject<HTMLInputElement>;
}

const ConfirmationInput: React.FC<ConfirmationInputProps> = ({
  confirmText,
  setConfirmText,
  requiredText,
  confirmInputRef,
}) => (
  <div className="mb-6">
    <label className="block text-sm font-medium text-gray-300 mb-2">
      Type "{requiredText}" to confirm:
    </label>
    <Input
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

interface ConfirmationStageProps {
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
}

export const ConfirmationStage: React.FC<ConfirmationStageProps> = ({
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
      <Button
        onClick={() => setStage("reason")}
        className="mr-3 p-1 text-gray-400 hover:text-white transition"
        aria-label="Go back"
      >
        <FaArrowLeft />
      </Button>
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
      <Button
        onClick={handleEmergencyUnlock}
        disabled={!canConfirm || isSubmitting}
        className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition"
      >
        {isSubmitting
          ? "Processing Emergency Unlock..."
          : requirePin
            ? "Continue to PIN Verification →"
            : "🚨 EMERGENCY UNLOCK 🚨"}
      </Button>
      <Button
        onClick={() => setStage("reason")}
        disabled={isSubmitting}
        className="w-full bg-gray-600 hover:bg-gray-500 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition"
      >
        Back to Reason Selection
      </Button>
    </div>
  </div>
);
