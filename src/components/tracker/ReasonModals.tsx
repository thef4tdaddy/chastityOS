import React from "react";

interface ReasonModalsProps {
  showReasonModal: boolean;
  onCancelRemoval?: () => void;
  onConfirmRemoval?: () => void;
  reasonForRemoval?: string;
  onReasonChange?: (reason: string) => void;
  showPauseReasonModal: boolean;
  onCancelPause?: () => void;
  onConfirmPause?: () => void;
  pauseReason?: string;
  onPauseReasonChange?: (reason: string) => void;
}

export const ReasonModals: React.FC<ReasonModalsProps> = ({
  showReasonModal,
  onCancelRemoval: _onCancelRemoval,
  onConfirmRemoval: _onConfirmRemoval,
  reasonForRemoval: _reasonForRemoval,
  onReasonChange: _onReasonChange,
  showPauseReasonModal,
  onCancelPause: _onCancelPause,
  onConfirmPause: _onConfirmPause,
  pauseReason: _pauseReason,
  onPauseReasonChange: _onPauseReasonChange,
}) => {
  return (
    <>
      {showReasonModal && <div>Reason for removal modal</div>}
      {showPauseReasonModal && <div>Reason for pause modal</div>}
    </>
  );
};
