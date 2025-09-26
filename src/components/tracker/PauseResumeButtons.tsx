import React, { useState } from "react";
// TODO: Replace with proper hook pattern to avoid architectural violations
// import { PauseService, EnhancedPauseReason } from "../../services/PauseService";
// import { PauseCooldownService, PauseState } from "../../services/PauseCooldownService";
import { serviceLogger } from "../../utils/logging";

// Temporary types until proper hook pattern is implemented
type EnhancedPauseReason = "Bathroom Break" | "Emergency" | "Medical" | "Other";
type PauseState = {
  canPause: boolean;
  lastPauseTime?: Date;
  nextPauseAvailable?: Date;
  cooldownRemaining?: number;
};

const logger = serviceLogger("PauseResumeButtons");

interface PauseResumeButtonsProps {
  sessionId: string;
  userId: string;
  isPaused: boolean;
  pauseState?: PauseState;
  onPause?: () => void;
  onResume?: () => void;
}

export const PauseResumeButtons: React.FC<PauseResumeButtonsProps> = ({
  sessionId,
  userId,
  isPaused,
  pauseState,
  onPause,
  onResume,
}) => {
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [selectedReason, setSelectedReason] =
    useState<EnhancedPauseReason>("Bathroom Break");
  const [customReason, setCustomReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePauseClick = () => {
    if (!pauseState?.canPause) return;
    setShowPauseModal(true);
  };

  const handleConfirmPause = async () => {
    if (!sessionId) return;

    setIsLoading(true);
    try {
      // TODO: Replace with proper service hook call
      // await PauseService.pauseSession(sessionId, selectedReason, customReason);
      await new Promise((resolve) => setTimeout(resolve, 500)); // Mock delay
      setShowPauseModal(false);
      setSelectedReason("Bathroom Break");
      setCustomReason("");
      onPause?.();
      logger.info("Session paused successfully (mocked)", { sessionId });
    } catch (error) {
      logger.error("Failed to pause session", error);
      // In a real app, you'd show a user-friendly error message
    } finally {
      setIsLoading(false);
    }
  };

  const handleResumeClick = async () => {
    if (!sessionId) return;

    setIsLoading(true);
    try {
      // TODO: Replace with proper service hook call
      // await PauseService.resumeSession(sessionId);
      await new Promise((resolve) => setTimeout(resolve, 500)); // Mock delay
      onResume?.();
      logger.info("Session resumed successfully (mocked)", { sessionId });
    } catch (error) {
      logger.error("Failed to resume session", error);
      // In a real app, you'd show a user-friendly error message
    } finally {
      setIsLoading(false);
    }
  };

  if (isPaused) {
    return (
      <div className="flex justify-center mb-8">
        <button
          type="button"
          onClick={handleResumeClick}
          disabled={isLoading}
          className="glass-button bg-gradient-to-r from-green-600/80 to-emerald-600/80 hover:from-green-500/90 hover:to-emerald-500/90 text-white font-bold py-3 px-6 shadow-lg hover:shadow-green-500/20 transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
        >
          ▶️ {isLoading ? "Resuming..." : "Resume Session"}
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-center mb-8">
        <button
          type="button"
          onClick={handlePauseClick}
          disabled={!pauseState?.canPause || isLoading}
          className={`glass-button font-bold py-3 px-6 shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 ${
            pauseState?.canPause
              ? "bg-gradient-to-r from-yellow-600/80 to-orange-600/80 hover:from-yellow-500/90 hover:to-orange-500/90 text-white hover:shadow-yellow-500/20"
              : "bg-gradient-to-r from-gray-400/80 to-gray-500/80 text-gray-300 cursor-not-allowed"
          }`}
        >
          ⏸️ {pauseState?.canPause ? "Pause Session" : "Cooldown Active"}
        </button>
      </div>

      {!pauseState?.canPause && pauseState?.cooldownRemaining && (
        <div className="text-sm text-yellow-600 mb-4 text-center">
          Next pause available in:{" "}
          {PauseCooldownService.formatTimeRemaining(
            pauseState.cooldownRemaining,
          )}
        </div>
      )}

      {/* Pause Reason Modal */}
      {showPauseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="glass-morphism p-6 md:p-8 text-center w-full max-w-md text-gray-50 border border-yellow-700/30">
            <h3 className="text-lg md:text-xl font-bold mb-4 text-yellow-300">
              Reason for Pausing Session
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select reason:
              </label>
              <select
                value={selectedReason}
                onChange={(e) =>
                  setSelectedReason(e.target.value as EnhancedPauseReason)
                }
                className="w-full p-2 rounded-lg border border-yellow-600/50 bg-gray-900/50 backdrop-blur-sm text-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                {(
                  [
                    "Bathroom Break",
                    "Emergency",
                    "Medical",
                    "Other",
                  ] as EnhancedPauseReason[]
                ).map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </div>

            {selectedReason === "Other" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Custom reason:
                </label>
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Enter custom reason"
                  className="w-full p-2 rounded-lg border border-yellow-600/50 bg-gray-900/50 backdrop-blur-sm text-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-around space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                type="button"
                onClick={handleConfirmPause}
                disabled={
                  isLoading ||
                  (selectedReason === "Other" && !customReason.trim())
                }
                className="w-full sm:w-auto glass-button bg-gradient-to-r from-yellow-600/80 to-yellow-700/80 hover:from-yellow-500/90 hover:to-yellow-600/90 text-white font-bold py-2 px-4 transition-all duration-300 disabled:opacity-50"
              >
                {isLoading ? "Pausing..." : "Confirm Pause"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPauseModal(false);
                  setSelectedReason("Bathroom Break");
                  setCustomReason("");
                }}
                disabled={isLoading}
                className="w-full sm:w-auto glass-button bg-gradient-to-r from-gray-600/80 to-gray-700/80 hover:from-gray-500/90 hover:to-gray-600/90 text-white font-bold py-2 px-4 transition-all duration-300 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
