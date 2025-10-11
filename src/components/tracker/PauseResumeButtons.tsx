import React from "react";
import { Button, Modal, Input, Select, SelectOption } from "@/components/ui";
import { usePauseResumeControls } from "../../hooks/tracker/usePauseResumeControls";

// Temporary types until proper hook pattern is implemented
type EnhancedPauseReason = "Bathroom Break" | "Emergency" | "Medical" | "Other";

type PauseState = {
  canPause: boolean;
  lastPauseTime?: Date;
  nextPauseAvailable?: Date;
  cooldownRemaining?: number;
};

// PauseButton sub-component
interface PauseButtonProps {
  canPause: boolean;
  isLoading: boolean;
  onPauseClick: () => void;
  pauseButtonStyling: string;
  pauseButtonText: string;
  cooldownDisplay?: string;
}

const PauseButton: React.FC<PauseButtonProps> = ({
  canPause,
  isLoading,
  onPauseClick,
  pauseButtonStyling,
  pauseButtonText,
  cooldownDisplay,
}) => (
  <div className="flex flex-col items-center mb-6 sm:mb-8 tracker-state-transition">
    <Button
      variant="primary"
      onClick={onPauseClick}
      disabled={!canPause || isLoading}
      loading={isLoading}
      className={`glass-button min-h-[44px] py-2.5 sm:py-3 px-5 sm:px-6 text-sm sm:text-base shadow-lg transform hover:scale-105 transition-all duration-300 button-press-active focus-ring-animated ${pauseButtonStyling}`}
    >
      ⏸️ {pauseButtonText}
    </Button>
    {!canPause && cooldownDisplay && (
      <p className="text-xs sm:text-sm text-nightly-deep_rose/80 mt-2 tracker-state-transition text-center">
        Next pause in: {cooldownDisplay}
      </p>
    )}
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
  <div className="flex justify-center mb-6 sm:mb-8 tracker-state-transition">
    <Button
      variant="primary"
      onClick={onResumeClick}
      disabled={isLoading}
      loading={isLoading}
      className="glass-button bg-gradient-to-r from-green-600/80 to-emerald-600/80 hover:from-green-500/90 hover:to-emerald-500/90 min-h-[44px] py-2.5 sm:py-3 px-5 sm:px-6 text-sm sm:text-base shadow-lg hover:shadow-green-500/20 transform hover:scale-105 transition-all duration-300 button-press-active focus-ring-animated"
    >
      ▶️ {isLoading ? "Resuming..." : "Resume Session"}
    </Button>
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

const PAUSE_REASONS: EnhancedPauseReason[] = [
  "Bathroom Break",
  "Emergency",
  "Medical",
  "Other",
];

const pauseReasonOptions: SelectOption[] = PAUSE_REASONS.map((reason) => ({
  value: reason,
  label: reason,
}));

const PauseModalContent: React.FC<PauseModalProps> = ({
  selectedReason,
  customReason,
  isLoading,
  onReasonChange,
  onCustomReasonChange,
  onConfirm,
  onCancel,
}) => (
  <div>
    <div className="mb-4">
      <Select
        label="Select reason:"
        value={selectedReason}
        onChange={(value) => onReasonChange(value as EnhancedPauseReason)}
        options={pauseReasonOptions}
      />
    </div>

    {selectedReason === "Other" && (
      <div className="mb-4">
        <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
          Custom reason:
        </label>
        <Input
          type="text"
          value={customReason}
          onChange={(e) => onCustomReasonChange(e.target.value)}
          placeholder="Enter custom reason"
          className="w-full min-h-[44px] p-2.5 sm:p-2 text-sm sm:text-base rounded-lg border border-yellow-600/50 bg-gray-900/50 backdrop-blur-sm text-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
      </div>
    )}

    <div className="flex flex-col sm:flex-row justify-around space-y-3 sm:space-y-0 sm:space-x-4">
      <Button
        variant="primary"
        onClick={onConfirm}
        disabled={
          isLoading || (selectedReason === "Other" && !customReason.trim())
        }
        loading={isLoading}
        className="w-full sm:w-auto glass-button bg-gradient-to-r from-yellow-600/80 to-yellow-700/80 hover:from-yellow-500/90 hover:to-yellow-600/90 min-h-[44px] py-2.5 px-4 text-sm sm:text-base transition-all duration-300 button-press-active focus-ring-animated"
      >
        {isLoading ? "Pausing..." : "Confirm Pause"}
      </Button>
      <Button
        variant="secondary"
        onClick={onCancel}
        disabled={isLoading}
        className="w-full sm:w-auto glass-button bg-gradient-to-r from-gray-600/80 to-gray-700/80 hover:from-gray-500/90 hover:to-gray-600/90 min-h-[44px] py-2.5 px-4 text-sm sm:text-base transition-all duration-300 button-press-active"
      >
        Cancel
      </Button>
    </div>
  </div>
);

const PauseModal: React.FC<PauseModalProps> = (props) => {
  return (
    <Modal
      isOpen={props.show}
      onClose={props.onCancel}
      title="Reason for Pausing Session"
      size="sm"
      showCloseButton={false}
      closeOnBackdropClick={false}
      closeOnEscape={!props.isLoading}
      className="glass-morphism border border-yellow-700/30 modal-slide-in"
    >
      <PauseModalContent {...props} />
    </Modal>
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

export const PauseResumeButtons: React.FC<PauseResumeButtonsProps> = ({
  sessionId,
  userId,
  isPaused,
  pauseState,
  onPause,
  onResume,
}) => {
  const {
    buttonStates,
    cooldownDisplay,
    pauseButtonStyling,
    pauseButtonText,
    showPauseModal,
    selectedReason,
    customReason,
    isLoading,
    handlePauseClick,
    handleResumeClick,
    handleConfirmPause,
    handleModalCancel,
    setSelectedReason,
    setCustomReason,
  } = usePauseResumeControls({
    sessionId,
    userId,
    isPaused,
    pauseState,
    onPause,
    onResume,
  });

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
          pauseButtonStyling={pauseButtonStyling}
          pauseButtonText={pauseButtonText}
          cooldownDisplay={cooldownDisplay}
        />
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
