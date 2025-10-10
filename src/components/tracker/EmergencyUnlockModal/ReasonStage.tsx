/**
 * Reason Stage Component for Emergency Unlock Modal
 * Allows user to select the emergency reason
 */
import React from "react";
import { FaArrowLeft, FaArrowRight } from "../../../utils/iconImport";
import type { EmergencyUnlockReason } from "../../../types/events";
import { EMERGENCY_UNLOCK_REASONS } from "../../../types/events";
import type { ModalStage } from "./types";
import { getReasonDescription } from "./types";
import { Textarea } from "@/components/ui";

interface ReasonSelectionListProps {
  reason: EmergencyUnlockReason | "";
  setReason: (reason: EmergencyUnlockReason | "") => void;
}

const ReasonSelectionList: React.FC<ReasonSelectionListProps> = ({
  reason,
  setReason,
}) => (
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

interface ReasonStageProps {
  setStage: (stage: ModalStage) => void;
  reason: EmergencyUnlockReason | "";
  setReason: (reason: EmergencyUnlockReason | "") => void;
  customReason: string;
  setCustomReason: (reason: string) => void;
  canProceedFromReason: boolean;
}

export const ReasonStage: React.FC<ReasonStageProps> = ({
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
        <Textarea
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
