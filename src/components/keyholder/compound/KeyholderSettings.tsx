/**
 * KeyholderSettings - Sub-component for keyholder settings
 */

import React from "react";
import { useKeyholderContext } from "./KeyholderContext";
import { FaLock, FaCog, FaEye } from "react-icons/fa";
import { KeyholderDurationSection } from "../../settings/KeyholderDurationSection";

export const KeyholderSettings: React.FC = () => {
  const {
    isKeyholderModeUnlocked,
    lockKeyholderControls,
    selectedRelationship,
  } = useKeyholderContext();

  // Only show if keyholder mode is unlocked
  if (!isKeyholderModeUnlocked) return null;

  return (
    <div className="space-y-6">
      {/* Keyholder Duration Goal */}
      {selectedRelationship?.wearerId && (
        <KeyholderDurationSection userId={selectedRelationship.wearerId} />
      )}

      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <FaCog className="text-nightly-spring-green" />
          <h3 className="text-lg font-semibold text-nightly-honeydew">
            Keyholder Settings
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="bg-white/5 hover:bg-white/10 p-4 rounded-lg text-left transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <FaEye className="text-nightly-aquamarine" />
              <span className="font-medium text-nightly-honeydew">
                View Full Report
              </span>
            </div>
            <p className="text-sm text-nightly-celadon">
              See complete session history and statistics
            </p>
          </button>

          <button className="bg-white/5 hover:bg-white/10 p-4 rounded-lg text-left transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <FaCog className="text-nightly-lavender-floral" />
              <span className="font-medium text-nightly-honeydew">
                Manage Rules
              </span>
            </div>
            <p className="text-sm text-nightly-celadon">
              Set requirements and restrictions
            </p>
          </button>
        </div>

        <button
          onClick={lockKeyholderControls}
          className="mt-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded font-medium transition-colors flex items-center gap-2"
        >
          <FaLock />
          Lock Controls
        </button>
      </div>
    </div>
  );
};
