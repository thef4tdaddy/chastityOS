/**
 * Emergency PIN Setup Component
 * Allows users to set/update/remove emergency unlock PIN for hardcore mode
 */
import React, { useState } from "react";
import { useAuthState } from "../../contexts";
import {
  useEmergencyPinStatus,
  useSetEmergencyPin,
  useRemoveEmergencyPin,
} from "../../hooks/api/useEmergencyPin";
import { useToast } from "../../hooks/state/useToast";
import {
  FaLock,
  FaUnlock,
  FaShieldAlt,
  FaCheck,
  FaTimes,
  FaEdit,
  FaTrash,
  FaSpinner,
} from "react-icons/fa";

interface EmergencyPinSetupProps {
  isHardcoreMode?: boolean;
}

export const EmergencyPinSetup: React.FC<EmergencyPinSetupProps> = ({
  isHardcoreMode = false,
}) => {
  const { user } = useAuthState();
  const { showWarning } = useToast();

  // Use TanStack Query hooks
  const { data: pinStatus, isLoading } = useEmergencyPinStatus(user?.uid);
  const setEmergencyPin = useSetEmergencyPin();
  const removeEmergencyPin = useRemoveEmergencyPin();

  const hasPin = pinStatus?.exists || false;
  const createdAt = pinStatus?.createdAt;

  const [isEditing, setIsEditing] = useState(false);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSavePin = async () => {
    if (!user?.uid) return;

    // Validation
    if (pin.length < 4) {
      setError("PIN must be at least 4 characters");
      return;
    }

    if (pin !== confirmPin) {
      setError("PINs do not match");
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      await setEmergencyPin.mutateAsync({ userId: user.uid, pin });

      setSuccess("Emergency PIN saved successfully");
      setIsEditing(false);
      setPin("");
      setConfirmPin("");

      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Failed to save PIN. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemovePin = async () => {
    if (!user?.uid) return;

    showWarning(
      "Are you sure you want to remove your emergency PIN? This is a safety feature for hardcore mode.",
      {
        action: {
          label: "Remove PIN",
          onClick: async () => {
            try {
              setIsSaving(true);
              await removeEmergencyPin.mutateAsync(user.uid);

              setSuccess("Emergency PIN removed");

              setTimeout(() => setSuccess(""), 3000);
            } catch {
              setError("Failed to remove PIN. Please try again.");
            } finally {
              setIsSaving(false);
            }
          },
        },
      },
    );
  };

  const handleCancel = () => {
    setIsEditing(false);
    setPin("");
    setConfirmPin("");
    setError("");
  };

  if (isLoading) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 text-nightly-celadon">
          <FaSpinner className="animate-spin" />
          <span>Loading emergency PIN settings...</span>
        </div>
      </div>
    );
  }

  // Editing mode
  if (isEditing) {
    return (
      <div className="glass-card p-6 border-2 border-red-500/30">
        <div className="flex items-center gap-2 mb-4">
          <FaShieldAlt className="text-red-400 text-xl" />
          <h3 className="text-xl font-bold text-nightly-honeydew">
            {hasPin ? "Update Emergency PIN" : "Set Emergency PIN"}
          </h3>
        </div>

        <p className="text-sm text-nightly-celadon mb-6">
          This PIN allows you to emergency unlock during hardcore mode sessions.
          Keep it secure and memorable.
        </p>

        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-nightly-celadon mb-2">
              Emergency PIN
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter 4+ character PIN"
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-nightly-honeydew focus:outline-none focus:border-red-500 font-mono"
              disabled={isSaving}
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="block text-sm text-nightly-celadon mb-2">
              Confirm PIN
            </label>
            <input
              type="password"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              placeholder="Re-enter PIN"
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-nightly-honeydew focus:outline-none focus:border-red-500 font-mono"
              disabled={isSaving}
              autoComplete="new-password"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSavePin}
              disabled={isSaving || !pin || !confirmPin}
              className="flex-1 bg-red-500/20 border border-red-500 hover:bg-red-500/30 text-red-400 font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <FaSpinner className="animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <FaCheck /> Save PIN
                </>
              )}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="flex-1 bg-white/5 border border-white/20 hover:bg-white/10 text-nightly-celadon font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <FaTimes /> Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Display mode
  return (
    <div className="glass-card p-6 border-2 border-red-500/30">
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
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-red-400"
            title={hasPin ? "Update PIN" : "Set PIN"}
          >
            {hasPin ? <FaEdit /> : <FaLock />}
          </button>
          {hasPin && (
            <button
              onClick={handleRemovePin}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-red-400"
              title="Remove PIN"
            >
              <FaTrash />
            </button>
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
        <button
          onClick={() => setIsEditing(true)}
          className="w-full mt-4 bg-red-500/20 border border-red-500 hover:bg-red-500/30 text-red-400 font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <FaLock /> Set Emergency PIN Now
        </button>
      )}
    </div>
  );
};
