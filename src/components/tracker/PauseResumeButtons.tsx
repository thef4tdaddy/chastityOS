import React, { useState } from "react";
// TODO: Replace with proper hook pattern to avoid architectural violations
// import { PauseService, EnhancedPauseReason } from "../../services/PauseService";
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

// Helper function to format cooldown time (inline until proper hook pattern)
const formatTimeRemaining = (cooldownSeconds: number): string => {
  const hours = Math.floor(cooldownSeconds / 3600);
  const minutes = Math.floor((cooldownSeconds % 3600) / 60);
  const seconds = cooldownSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

// Helper function to get button states and conditions
const getButtonStates = (isPaused: boolean, pauseState?: PauseState) => {
  return {
    showPause: !isPaused,
    showResume: isPaused,
    canPause: pauseState?.canPause ?? false,
    showCooldown: !pauseState?.canPause && !!pauseState?.cooldownRemaining,
  };
};

// Helper function to get button styling
const getPauseButtonStyling = (canPause: boolean) => {
  return canPause
    ? "bg-gradient-to-r from-yellow-600/80 to-orange-600/80 hover:from-yellow-500/90 hover:to-orange-500/90 text-white hover:shadow-yellow-500/20"
    : "bg-gradient-to-r from-gray-400/80 to-gray-500/80 text-gray-300 cursor-not-allowed";
};

// Helper function to get button text
const getPauseButtonText = (canPause: boolean) => {
  return canPause ? "Pause Session" : "Cooldown Active";
};

// PauseButton sub-component
interface PauseButtonProps {
  canPause: boolean;
  isLoading: boolean;
  onPauseClick: () => void;
}

const PauseButton: React.FC<PauseButtonProps> = ({
  canPause,
  isLoading,
  onPauseClick,
}) => (
  <div className="flex justify-center mb-8">
    <button
      type="button"
      onClick={onPauseClick}
      disabled={!canPause || isLoading}
      className={`glass-button font-bold py-3 px-6 shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 ${getPauseButtonStyling(canPause)}`}
    >
      ⏸️ {getPauseButtonText(canPause)}
    </button>
  </div>
);

// ResumeButton sub-component
interface ResumeButtonProps {
  isLoading: boolean;
  onResumeClick: () => void;
}

const ResumeButton: React.FC<ResumeButtonProps> = ({
  isLoading,
  onResumeClick,
}) => (
  <div className="flex justify-center mb-8">
    <button
      type="button"
      onClick={onResumeClick}
      disabled={isLoading}
      className="glass-button bg-gradient-to-r from-green-600/80 to-emerald-600/80 hover:from-green-500/90 hover:to-emerald-500/90 text-white font-bold py-3 px-6 shadow-lg hover:shadow-green-500/20 transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
    >
      ▶️ {isLoading ? "Resuming..." : "Resume Session"}
    </button>
  </div>
);

// CooldownDisplay sub-component
interface CooldownDisplayProps {
  cooldownRemaining: number;
}

const CooldownDisplay: React.FC<CooldownDisplayProps> = ({
  cooldownRemaining,
}) => (
  <div className="text-sm text-yellow-600 mb-4 text-center">
    Next pause available in: {formatTimeRemaining(cooldownRemaining)}
  </div>
);

// PauseModal sub-component
interface PauseModalProps {
  show: boolean;
  selectedReason: EnhancedPauseReason;
  customReason: string;
  isLoading: boolean;
  onReasonChange: (reason: EnhancedPauseReason) => void;
  onCustomReasonChange: (reason: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const PauseModal: React.FC<PauseModalProps> = ({
  show,
  selectedReason,
  customReason,
  isLoading,
  onReasonChange,
  onCustomReasonChange,
  onConfirm,
  onCancel,
}) => {
  if (!show) return null;

  const reasons: EnhancedPauseReason[] = [
    "Bathroom Break",
    "Emergency",
    "Medical",
    "Other",
  ];

  return (
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
              onReasonChange(e.target.value as EnhancedPauseReason)
            }
            className="w-full p-2 rounded-lg border border-yellow-600/50 bg-gray-900/50 backdrop-blur-sm text-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            {reasons.map((reason) => (
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
              onChange={(e) => onCustomReasonChange(e.target.value)}
              placeholder="Enter custom reason"
              className="w-full p-2 rounded-lg border border-yellow-600/50 bg-gray-900/50 backdrop-blur-sm text-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-around space-y-3 sm:space-y-0 sm:space-x-4">
          <button
            type="button"
            onClick={onConfirm}
            disabled={
              isLoading || (selectedReason === "Other" && !customReason.trim())
            }
            className="w-full sm:w-auto glass-button bg-gradient-to-r from-yellow-600/80 to-yellow-700/80 hover:from-yellow-500/90 hover:to-yellow-600/90 text-white font-bold py-2 px-4 transition-all duration-300 disabled:opacity-50"
          >
            {isLoading ? "Pausing..." : "Confirm Pause"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full sm:w-auto glass-button bg-gradient-to-r from-gray-600/80 to-gray-700/80 hover:from-gray-500/90 hover:to-gray-600/90 text-white font-bold py-2 px-4 transition-all duration-300 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

interface PauseResumeButtonsProps {
  sessionId: string;
  userId: string;
  isPaused: boolean;
  pauseState?: PauseState;
  onPause?: () => void;
  onResume?: () => void;
}

// Helper functions for async operations
const executeWithLoadingState = async (
  setIsLoading: (loading: boolean) => void,
  operation: () => Promise<void>,
) => {
  setIsLoading(true);
  try {
    await operation();
  } catch (error) {
    logger.error("Operation failed", error);
  } finally {
    setIsLoading(false);
  }
};

const resetModalState = (
  setShowPauseModal: (show: boolean) => void,
  setSelectedReason: (reason: EnhancedPauseReason) => void,
  setCustomReason: (reason: string) => void,
) => {
  setShowPauseModal(false);
  setSelectedReason("Bathroom Break");
  setCustomReason("");
};

// Custom hook to manage pause/resume logic
const usePauseResumeLogic = (
  sessionId: string,
  onPause?: () => void,
  onResume?: () => void,
) => {
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [selectedReason, setSelectedReason] =
    useState<EnhancedPauseReason>("Bathroom Break");
  const [customReason, setCustomReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirmPause = async () => {
    if (!sessionId) return;
    await executeWithLoadingState(setIsLoading, async () => {
      // TODO: Replace with proper service hook call
      await new Promise((resolve) => setTimeout(resolve, 500)); // Mock delay
      resetModalState(setShowPauseModal, setSelectedReason, setCustomReason);
      onPause?.();
      logger.info("Session paused successfully (mocked)", { sessionId });
    });
  };

  const handleResumeClick = async () => {
    if (!sessionId) return;
    await executeWithLoadingState(setIsLoading, async () => {
      // TODO: Replace with proper service hook call
      await new Promise((resolve) => setTimeout(resolve, 500)); // Mock delay
      onResume?.();
      logger.info("Session resumed successfully (mocked)", { sessionId });
    });
  };

  const handleModalCancel = () => {
    resetModalState(setShowPauseModal, setSelectedReason, setCustomReason);
  };

  return {
    showPauseModal,
    setShowPauseModal,
    selectedReason,
    setSelectedReason,
    customReason,
    setCustomReason,
    isLoading,
    handleConfirmPause,
    handleResumeClick,
    handleModalCancel,
  };
};

export const PauseResumeButtons: React.FC<PauseResumeButtonsProps> = ({
  sessionId,
  _userId, // Mark as unused with underscore prefix
  isPaused,
  pauseState,
  onPause,
  onResume,
}) => {
  const {
    showPauseModal,
    setShowPauseModal,
    selectedReason,
    setSelectedReason,
    customReason,
    setCustomReason,
    isLoading,
    handleConfirmPause,
    handleResumeClick,
    handleModalCancel,
  } = usePauseResumeLogic(sessionId, onPause, onResume);

  const buttonStates = getButtonStates(isPaused, pauseState);

  const handlePauseClick = () => {
    if (!pauseState?.canPause) return;
    setShowPauseModal(true);
  };

  return (
    <>
      {buttonStates.showResume && (
        <ResumeButton isLoading={isLoading} onResumeClick={handleResumeClick} />
      )}

      {buttonStates.showPause && (
        <PauseButton
          canPause={buttonStates.canPause}
          isLoading={isLoading}
          onPauseClick={handlePauseClick}
        />
      )}

      {buttonStates.showCooldown && pauseState?.cooldownRemaining && (
        <CooldownDisplay cooldownRemaining={pauseState.cooldownRemaining} />
      )}

      <PauseModal
        show={showPauseModal}
        selectedReason={selectedReason}
        customReason={customReason}
        isLoading={isLoading}
        onReasonChange={setSelectedReason}
        onCustomReasonChange={setCustomReason}
        onConfirm={handleConfirmPause}
        onCancel={handleModalCancel}
      />
    </>
  );
};
