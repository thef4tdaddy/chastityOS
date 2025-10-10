import React from "react";
import { Button } from "@/components/ui";

interface RestoreSessionPromptProps {
  onConfirm: () => void;
  onDiscard: () => void;
}

export const RestoreSessionPrompt: React.FC<RestoreSessionPromptProps> = ({
  onConfirm,
  onDiscard,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-700 p-6 md:p-8 rounded-xl shadow-lg text-center w-full max-w-md text-gray-50 border border-blue-500">
        <h3 className="text-lg md:text-xl font-bold mb-4 text-blue-300">
          Restore Previous Session?
        </h3>
        <p className="text-sm text-gray-300 mb-4">
          An active chastity session was found. Would you like to resume this
          session or start a new one?
        </p>
        <div className="flex flex-col sm:flex-row justify-around space-y-3 sm:space-y-0 sm:space-x-4">
          <Button
            type="button"
            onClick={onConfirm}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            Resume Previous Session
          </Button>
          <Button
            type="button"
            onClick={onDiscard}
            className="w-full sm:w-auto bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            Start New Session
          </Button>
        </div>
      </div>
    </div>
  );
};
