/**
 * Hardcore Mode Section Component
 * Handles emergency PIN and lock combination settings for hardcore mode
 */
import React from "react";
import { FaLock, FaShieldAlt, FaExclamationTriangle } from "react-icons/fa";
import { EmergencyPinSetupSection } from "./EmergencyPinSetupSection";
import { LockCombinationSection } from "./LockCombinationSection";

interface HardcoreModeSectionProps {
  isHardcoreMode: boolean;
  setIsHardcoreMode: (value: boolean) => void;
  hasEmergencyPin: boolean;
  emergencyPinInput: string;
  setEmergencyPinInput: (value: string) => void;
  confirmEmergencyPin: string;
  setConfirmEmergencyPin: (value: string) => void;
  saveLockCombination: boolean;
  setSaveLockCombination: (value: boolean) => void;
  lockCombination: string;
  setLockCombination: (value: string) => void;
  isSignedInWithGoogle: boolean;
  pinError: string;
  setPinError: (value: string) => void;
  isCreating: boolean;
}

export const HardcoreModeSection: React.FC<HardcoreModeSectionProps> = ({
  isHardcoreMode,
  setIsHardcoreMode,
  hasEmergencyPin,
  emergencyPinInput,
  setEmergencyPinInput,
  confirmEmergencyPin,
  setConfirmEmergencyPin,
  saveLockCombination,
  setSaveLockCombination,
  lockCombination,
  setLockCombination,
  isSignedInWithGoogle,
  pinError,
  setPinError,
  isCreating,
}) => {
  return (
    <div className="border-t border-white/10 pt-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FaLock className="text-red-400" />
          <label className="text-sm font-medium text-nightly-celadon">
            Hardcore Mode
          </label>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isHardcoreMode}
            onChange={(e) => setIsHardcoreMode(e.target.checked)}
            className="sr-only peer"
            disabled={isCreating}
          />
          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
        </label>
      </div>
      <p className="text-xs text-nightly-celadon/70 mb-3">
        Hardcore mode prevents early unlock and requires emergency PIN for
        safety.
      </p>

      {isHardcoreMode && (
        <div className="space-y-4 bg-red-500/5 border border-red-500/20 rounded-lg p-4">
          {/* Emergency PIN Setup (if not already set) */}
          {!hasEmergencyPin && (
            <EmergencyPinSetupSection
              emergencyPinInput={emergencyPinInput}
              setEmergencyPinInput={setEmergencyPinInput}
              confirmEmergencyPin={confirmEmergencyPin}
              setConfirmEmergencyPin={setConfirmEmergencyPin}
              setPinError={setPinError}
              isCreating={isCreating}
            />
          )}

          {hasEmergencyPin && (
            <div className="bg-green-500/10 border border-green-500/30 rounded p-3">
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <FaShieldAlt />
                <span>Emergency PIN already set</span>
              </div>
            </div>
          )}

          {/* Lock Combination Option */}
          <LockCombinationSection
            saveLockCombination={saveLockCombination}
            setSaveLockCombination={setSaveLockCombination}
            lockCombination={lockCombination}
            setLockCombination={setLockCombination}
            isSignedInWithGoogle={isSignedInWithGoogle}
            isCreating={isCreating}
          />

          {/* Liability Disclaimer */}
          <div className="bg-yellow-900/10 border border-yellow-600/20 rounded p-3">
            <div className="flex items-start gap-2">
              <FaExclamationTriangle className="text-yellow-400 text-sm mt-0.5 flex-shrink-0" />
              <div className="text-xs text-yellow-300">
                <p className="font-semibold mb-1">Important Disclaimer</p>
                <p>
                  Lock combinations are encrypted and stored securely, but we
                  are <strong>NOT liable</strong> if they are lost. Use at your
                  own risk. Always have a backup key or emergency plan.
                </p>
              </div>
            </div>
          </div>

          {/* PIN Error Display */}
          {pinError && (
            <div className="bg-red-500/20 border border-red-500 rounded p-3">
              <p className="text-red-400 text-xs">{pinError}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
