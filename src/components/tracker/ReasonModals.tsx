
import React from 'react';

interface ReasonModalsProps {
  showReasonModal: boolean;
  showPauseReasonModal: boolean;
}

export const ReasonModals: React.FC<ReasonModalsProps> = ({ showReasonModal, showPauseReasonModal }) => {
  return (
    <>
      {showReasonModal && (
        <div>Reason for removal modal</div>
      )}
      {showPauseReasonModal && (
        <div>Reason for pause modal</div>
      )}
    </>
  );
};
