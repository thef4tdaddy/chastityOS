/**
 * Lock Combination Section
 * Handles lock combination input with Google sign-in requirement
 */
import React from "react";
import { FaExclamationTriangle } from "../../utils/iconImport";
import { Input, Checkbox } from "@/components/ui";

interface LockCombinationSectionProps {
  saveLockCombination: boolean;
  setSaveLockCombination: (value: boolean) => void;
  lockCombination: string;
  setLockCombination: (value: string) => void;
  isSignedInWithGoogle: boolean;
  isCreating: boolean;
}

export const LockCombinationSection: React.FC<LockCombinationSectionProps> = ({
  saveLockCombination,
  setSaveLockCombination,
  lockCombination,
  setLockCombination,
  isSignedInWithGoogle,
  isCreating,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Checkbox
          checked={saveLockCombination}
          onChange={setSaveLockCombination}
          label="Save Lock Combination (Optional)"
          disabled={isCreating}
        />
      </div>

      {saveLockCombination && (
        <>
          {!isSignedInWithGoogle && (
            <div className="bg-yellow-900/20 border border-yellow-600/30 rounded p-3">
              <div className="flex items-start gap-2">
                <FaExclamationTriangle className="text-yellow-400 mt-0.5" />
                <div className="text-xs text-yellow-300">
                  <p className="font-semibold mb-1">Google Sign-In Required</p>
                  <p>
                    Lock combination storage requires Google authentication to
                    prevent data loss. Please sign in with Google first.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isSignedInWithGoogle && (
            <div className="space-y-2">
              <Input
                type="text"
                value={lockCombination}
                onChange={(e) => setLockCombination(e.target.value)}
                placeholder="e.g., 4-2-8-1 or BLUE-RED-GREEN"
                className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-nightly-honeydew focus:outline-none focus:border-red-500"
                disabled={isCreating}
              />
              <p className="text-xs text-nightly-celadon/70">
                Your physical lock combination will be encrypted and saved
                securely.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
