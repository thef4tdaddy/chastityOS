import React from "react";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaSpinner,
} from "../../utils/iconImport";
import { Modal, Button } from "@/components/ui";

interface ResetModalProps {
  show: boolean;
  status: "idle" | "pending" | "success" | "error";
  onConfirm: () => void;
  onCancel: () => void;
}

export const ResetModal: React.FC<ResetModalProps> = ({
  show,
  status,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      isOpen={show}
      onClose={onCancel}
      title="Confirm Data Reset"
      size="sm"
      showCloseButton={false}
      closeOnBackdropClick={false}
      closeOnEscape={status !== "pending"}
      className="border-2 border-red-500"
      footer={
        <div className="flex gap-3">
          <Button
            onClick={onCancel}
            disabled={status === "pending"}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={status === "pending"}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === "pending" ? "Resetting..." : "Reset All Data"}
          </Button>
        </div>
      }
    >
      <div>
        <p className="text-nightly-celadon mb-6">
          Are you sure you want to reset all data? This will permanently delete:
        </p>
        <ul className="list-disc list-inside text-nightly-celadon mb-6 space-y-1">
          <li>All sessions and history</li>
          <li>All tasks and goals</li>
          <li>All settings and preferences</li>
          <li>All achievements and progress</li>
        </ul>

        {status === "pending" && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded p-3 mb-4 flex items-center gap-2">
            <FaSpinner className="animate-spin text-blue-400" />
            <p className="text-blue-300 text-sm">Resetting data...</p>
          </div>
        )}

        {status === "error" && (
          <div className="bg-red-500/10 border border-red-500/20 rounded p-3 mb-4 flex items-center gap-2">
            <FaExclamationTriangle className="text-red-400" />
            <p className="text-red-300 text-sm">
              Failed to reset data. Please try again.
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="bg-green-500/10 border border-green-500/20 rounded p-3 mb-4 flex items-center gap-2">
            <FaCheckCircle className="text-green-400" />
            <p className="text-green-300 text-sm">
              Data reset complete. Refreshing...
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};
