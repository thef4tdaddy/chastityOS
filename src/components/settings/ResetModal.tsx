import React from "react";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaSpinner,
} from "../../utils/iconImport";

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
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border-2 border-red-500 rounded-lg max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-red-400 mb-4">
          Confirm Data Reset
        </h3>
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

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={status === "pending"}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={status === "pending"}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === "pending" ? "Resetting..." : "Reset All Data"}
          </button>
        </div>
      </div>
    </div>
  );
};
