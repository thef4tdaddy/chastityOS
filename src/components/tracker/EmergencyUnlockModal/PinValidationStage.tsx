/**
 * PIN Validation Stage Component for Emergency Unlock Modal
 * Used in hardcore mode to validate emergency PIN
 */
import React from "react";
import { FaArrowLeft, FaLock, FaSpinner } from "react-icons/fa";
import type { ModalStage } from "./types";
import { Input } from "@/components/ui";

interface PinValidationStageProps {
  userId: string;
  pin: string;
  setPin: (pin: string) => void;
  pinError: string;
  attemptCount: number;
  isValidating: boolean;
  handlePinSubmit: () => Promise<void>;
  setStage: (stage: ModalStage) => void;
}

export const PinValidationStage: React.FC<PinValidationStageProps> = ({
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
      <Input
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
