/**
 * Emergency PIN Setup Section
 * Displays emergency PIN setup fields when user doesn't have a PIN
 */
import React from "react";
import { FaShieldAlt } from "react-icons/fa";
import { Input } from "@/components/ui";

interface EmergencyPinSetupSectionProps {
  emergencyPinInput: string;
  setEmergencyPinInput: (value: string) => void;
  confirmEmergencyPin: string;
  setConfirmEmergencyPin: (value: string) => void;
  setPinError: (value: string) => void;
  isCreating: boolean;
}

export const EmergencyPinSetupSection: React.FC<
  EmergencyPinSetupSectionProps
> = ({
  emergencyPinInput,
  setEmergencyPinInput,
  confirmEmergencyPin,
  setConfirmEmergencyPin,
  setPinError,
  isCreating,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-red-400">
        <FaShieldAlt />
        <span className="text-sm font-semibold">Set Emergency PIN</span>
      </div>
      <p className="text-xs text-nightly-celadon">
        Required for hardcore mode safety. This PIN allows emergency unlock if
        truly needed.
      </p>
      <Input
        type="password"
        value={emergencyPinInput}
        onChange={(e) => {
          setEmergencyPinInput(e.target.value);
          setPinError("");
        }}
        placeholder="Enter 4+ character PIN"
        className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-nightly-honeydew focus:outline-none focus:border-red-500 font-mono"
        disabled={isCreating}
      />
      <Input
        type="password"
        value={confirmEmergencyPin}
        onChange={(e) => {
          setConfirmEmergencyPin(e.target.value);
          setPinError("");
        }}
        placeholder="Confirm PIN"
        className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-nightly-honeydew focus:outline-none focus:border-red-500 font-mono"
        disabled={isCreating}
      />
    </div>
  );
};
