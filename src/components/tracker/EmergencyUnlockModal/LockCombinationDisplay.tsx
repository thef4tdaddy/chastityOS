/**
 * Lock Combination Display Component for Emergency Unlock Modal
 * Shows retrieved lock combination to user
 */
import React, { useState } from "react";
import { serviceLogger } from "../../../utils/logging";

const logger = serviceLogger("LockCombinationDisplay");

interface LockCombinationDisplayProps {
  combination: string;
  onContinue: () => void;
}

export const LockCombinationDisplay: React.FC<LockCombinationDisplayProps> = ({
  combination,
  onContinue,
}) => {
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
