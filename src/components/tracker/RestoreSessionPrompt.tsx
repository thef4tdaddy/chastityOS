import React from "react";
import { Modal } from "@/components/ui";

interface RestoreSessionPromptProps {
  onConfirm: () => void;
  onDiscard: () => void;
}

export const RestoreSessionPrompt: React.FC<RestoreSessionPromptProps> = ({
  onConfirm,
  onDiscard,
}) => {
  return (
    <Modal
      isOpen={true}
      onClose={onDiscard}
      title="Restore Previous Session?"
      size="sm"
      showCloseButton={false}
      closeOnBackdropClick={false}
      closeOnEscape={false}
      className="border border-blue-500"
      footer={
        <div className="flex flex-col sm:flex-row justify-around space-y-3 sm:space-y-0 sm:space-x-4">
          <button
            type="button"
            onClick={onConfirm}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            Resume Previous Session
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className="w-full sm:w-auto bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            Start New Session
          </button>
        </div>
      }
    >
      <p className="text-sm text-gray-300 text-center">
        An active chastity session was found. Would you like to resume this
        session or start a new one?
      </p>
    </Modal>
  );
};
