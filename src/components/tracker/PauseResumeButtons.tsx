import React, { useState } from "react";
import { PauseService, EnhancedPauseReason } from "../../services/PauseService";
import {
  PauseCooldownService,
  PauseState,
} from "../../services/PauseCooldownService";
import { serviceLogger } from "../../utils/logging";

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
      await PauseService.pauseSession(sessionId, selectedReason, customReason);
      setShowPauseModal(false);
      setSelectedReason("Bathroom Break");
      setCustomReason("");
      onPause?.();
      logger.info("Session paused successfully", { sessionId });
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
      await PauseService.resumeSession(sessionId);
      onResume?.();
      logger.info("Session resumed successfully", { sessionId });
    } catch (error) {
      logger.error("Failed to resume session", error);
      // In a real app, you'd show a user-friendly error message
    } finally {
      setIsLoading(false);
    }
  };

  if (isPaused) {
    return (
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mb-6 md:mb-8 justify-center">
        <button
          type="button"
          onClick={handleResumeClick}
          disabled={isLoading}
          className="flex-grow bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition disabled:opacity-50"
        >
          ▶️ {isLoading ? "Resuming..." : "Resume Session"}
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mb-6 md:mb-8 justify-center">
        <button
          type="button"
          onClick={handlePauseClick}
          disabled={!pauseState?.canPause || isLoading}
          className={`flex-grow font-bold py-2 px-4 rounded-lg shadow-md transition disabled:opacity-50 ${
            pauseState?.canPause
              ? "bg-yellow-500 hover:bg-yellow-600 text-white"
              : "bg-gray-400 text-gray-700 cursor-not-allowed"
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
          <div className="bg-gray-800 p-6 md:p-8 rounded-xl shadow-lg text-center w-full max-w-md text-gray-50 border border-yellow-700">
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
                className="w-full p-2 rounded-lg border border-yellow-600 bg-gray-900 text-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                {PauseService.getPauseReasons().map((reason) => (
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
                  className="w-full p-2 rounded-lg border border-yellow-600 bg-gray-900 text-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-500"
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
                className="w-full sm:w-auto bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
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
                className="w-full sm:w-auto bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
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
