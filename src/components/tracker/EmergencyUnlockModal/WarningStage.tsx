/**
 * Warning Stage Component for Emergency Unlock Modal
 * Shows initial warning about emergency unlock
 */
import React from "react";
import { Button } from "@/components/ui";
import { FaExclamationTriangle, FaArrowRight } from "../../../utils/iconImport";
import type { ModalStage } from "./types";

interface WarningStageProps {
  setStage: (stage: ModalStage) => void;
  onClose: () => void;
}

export const WarningStage: React.FC<WarningStageProps> = ({
  setStage,
  onClose,
}) => (
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
      <Button
        onClick={() => setStage("reason")}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center"
      >
        I Understand - Continue
        <FaArrowRight className="ml-2" />
      </Button>
      <Button
        onClick={onClose}
        className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg transition"
      >
        Cancel
      </Button>
    </div>
  </div>
);
