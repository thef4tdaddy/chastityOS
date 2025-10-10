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
import { Textarea, RadioGroup, RadioOption, Button } from "@/components/ui";

interface ReasonSelectionListProps {
  reason: EmergencyUnlockReason | "";
  setReason: (reason: EmergencyUnlockReason | "") => void;
}

const reasonOptions: RadioOption[] = EMERGENCY_UNLOCK_REASONS.map(
  (emergencyReason) => ({
    value: emergencyReason,
    label: emergencyReason,
    description: getReasonDescription(emergencyReason),
  }),
);

const ReasonSelectionList: React.FC<ReasonSelectionListProps> = ({
  reason,
  setReason,
}) => (
  <div className="mb-6">
    <RadioGroup
      name="emergency-reason"
      value={reason}
      onChange={(value) => setReason(value as EmergencyUnlockReason)}
      options={reasonOptions}
      size="md"
      className="[&_label]:p-3 [&_label]:rounded-lg [&_label]:border [&_label]:transition"
    />
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
      <Button
        onClick={() => setStage("warning")}
        className="mr-3 p-1 text-gray-400 hover:text-white transition"
        aria-label="Go back"
      >
        <FaArrowLeft />
      </Button>
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
      <Button
        onClick={() => setStage("confirm")}
        disabled={!canProceedFromReason}
        className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center"
      >
        Continue to Confirmation
        <FaArrowRight className="ml-2" />
      </Button>
      <Button
        onClick={() => setStage("warning")}
        className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg transition"
      >
        Back
      </Button>
    </div>
  </div>
);
