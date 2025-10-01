import { useState } from "react";
import { serviceLogger } from "../../utils/logging";

const logger = serviceLogger("usePauseResumeControls");

// Temporary types until proper hook pattern is implemented
type EnhancedPauseReason = "Bathroom Break" | "Emergency" | "Medical" | "Other";

type PauseState = {
  canPause: boolean;
  lastPauseTime?: Date;
  nextPauseAvailable?: Date;
  cooldownRemaining?: number;
};

export interface UsePauseResumeControlsProps {
  sessionId: string;
  userId: string;
  _userId?: string;
  isPaused: boolean;
  pauseState?: PauseState;
  onPause?: () => void;
  onResume?: () => void;
}

export interface UsePauseResumeControlsReturn {
  // State
  isPaused: boolean;
  canPause: boolean;
  cooldownRemaining: number;
  showPauseModal: boolean;
  selectedReason: EnhancedPauseReason;
  customReason: string;
  isLoading: boolean;

  // Actions
  handlePauseClick: () => void;
  handleResumeClick: () => void;
  handleConfirmPause: () => Promise<void>;
  handleModalCancel: () => void;
  setSelectedReason: (reason: EnhancedPauseReason) => void;
  setCustomReason: (reason: string) => void;

  // Computed values
  buttonStates: {
    showPause: boolean;
    showResume: boolean;
    canPause: boolean;
    showCooldown: boolean;
  };
  cooldownDisplay: string;
  pauseButtonStyling: string;
  pauseButtonText: string;
}

// Helper function to format cooldown time
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

export const usePauseResumeControls = ({
  sessionId,
  _userId,
  isPaused,
  pauseState,
  onPause,
  onResume,
}: UsePauseResumeControlsProps): UsePauseResumeControlsReturn => {
  // Local state for modal
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [selectedReason, setSelectedReason] =
    useState<EnhancedPauseReason>("Bathroom Break");
  const [customReason, setCustomReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Use existing pause state hook for actual pause data
  // const pauseStateData = usePauseState({ userId, sessionId });

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

  const handlePauseClick = () => {
    if (!pauseState?.canPause) return;
    setShowPauseModal(true);
  };

  const handleModalCancel = () => {
    resetModalState(setShowPauseModal, setSelectedReason, setCustomReason);
  };

  const buttonStates = getButtonStates(isPaused, pauseState);
  const cooldownDisplay = formatTimeRemaining(
    pauseState?.cooldownRemaining ?? 0,
  );
  const pauseButtonStyling = getPauseButtonStyling(buttonStates.canPause);
  const pauseButtonText = getPauseButtonText(buttonStates.canPause);

  return {
    // State
    isPaused,
    canPause: pauseState?.canPause ?? false,
    cooldownRemaining: pauseState?.cooldownRemaining ?? 0,
    showPauseModal,
    selectedReason,
    customReason,
    isLoading,

    // Actions
    handlePauseClick,
    handleResumeClick,
    handleConfirmPause,
    handleModalCancel,
    setSelectedReason,
    setCustomReason,

    // Computed values
    buttonStates,
    cooldownDisplay,
    pauseButtonStyling,
    pauseButtonText,
  };
};
