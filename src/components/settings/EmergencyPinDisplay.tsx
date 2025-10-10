/**
 * Emergency PIN Display Component
 * Shows emergency PIN status and controls
 */
import React from "react";
import { FaShieldAlt, FaLock, FaUnlock, FaEdit, FaTrash } from "react-icons/fa";
import { Card } from "@/components/ui";

interface EmergencyPinDisplayProps {
  hasPin: boolean;
  createdAt?: Date;
  isHardcoreMode: boolean;
  success: string;
  onEdit: () => void;
  onRemove: () => void;
}

export const EmergencyPinDisplay: React.FC<EmergencyPinDisplayProps> = ({
  hasPin,
  createdAt,
  isHardcoreMode,
  success,
  onEdit,
  onRemove,
}) => {
  return (
    <Card variant="glass" padding="lg" className="border-2 border-red-500/30">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <FaShieldAlt className="text-red-400 text-xl" />
            <h3 className="text-xl font-bold text-nightly-honeydew">
              Emergency PIN
            </h3>
          </div>
          <p className="text-sm text-nightly-celadon">
            {isHardcoreMode
              ? "Required for hardcore mode sessions - allows emergency unlock"
              : "Safety feature for hardcore mode goals"}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={onEdit}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-red-400"
            title={hasPin ? "Update PIN" : "Set PIN"}
          >
            {hasPin ? <FaEdit /> : <FaLock />}
          </Button>
          {hasPin && (
            <Button
              onClick={onRemove}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-red-400"
              title="Remove PIN"
            >
              <FaTrash />
            </Button>
          )}
        </div>
      </div>

      {success && (
        <div className="bg-green-500/20 border border-green-500 rounded-lg p-3 mb-4">
          <p className="text-green-400 text-sm">{success}</p>
        </div>
      )}

      <div className="bg-red-500/10 rounded-lg p-4">
        {hasPin ? (
          <>
            <div className="flex items-center gap-2 mb-2">
              <FaUnlock className="text-green-400" />
              <p className="text-sm font-semibold text-nightly-honeydew">
                Emergency PIN is set
              </p>
            </div>
            <p className="text-xs text-nightly-celadon">
              Created: {createdAt?.toLocaleDateString()}
            </p>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-2">
              <FaLock className="text-red-400" />
              <p className="text-sm font-semibold text-nightly-honeydew">
                No emergency PIN set
              </p>
            </div>
            <p className="text-xs text-nightly-celadon">
              {isHardcoreMode
                ? "Set a PIN to enable hardcore mode features"
                : "Recommended for safety in hardcore mode sessions"}
            </p>
          </>
        )}
      </div>

      {!hasPin && isHardcoreMode && (
        <Button
          onClick={onEdit}
          className="w-full mt-4 bg-red-500/20 border border-red-500 hover:bg-red-500/30 text-red-400 font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <FaLock /> Set Emergency PIN Now
        </Button>
      )}
    </Card>
  );
};
