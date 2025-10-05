/**
 * Create Personal Goal Form Component
 * Form for creating a new personal chastity duration goal
 */
import React, { useState, useEffect } from "react";
import {
  FaPlus,
  FaTimes,
  FaLock,
  FaShieldAlt,
  FaExclamationTriangle,
} from "react-icons/fa";
import { useAuthState } from "../../contexts";
import { EmergencyPinDBService } from "../../services/database/EmergencyPinDBService";
import { checkGoogleSignIn } from "../../utils/auth/google-auth-check";

interface CreatePersonalGoalFormProps {
  onCreate: (
    title: string,
    targetDuration: number,
    description?: string,
  ) => void;
  isCreating: boolean;
}

export const CreatePersonalGoalForm: React.FC<CreatePersonalGoalFormProps> = ({
  onCreate,
  isCreating,
}) => {
  const { user } = useAuthState();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [days, setDays] = useState(7);
  const [hours, setHours] = useState(0);
  const [description, setDescription] = useState("");

  // Hardcore mode state
  const [isHardcoreMode, setIsHardcoreMode] = useState(false);
  const [hasEmergencyPin, setHasEmergencyPin] = useState(false);
  const [emergencyPin, setEmergencyPin] = useState("");
  const [confirmEmergencyPin, setConfirmEmergencyPin] = useState("");
  const [lockCombination, setLockCombination] = useState("");
  const [saveLockCombination, setSaveLockCombination] = useState(false);
  const [isSignedInWithGoogle, setIsSignedInWithGoogle] = useState(false);
  const [pinError, setPinError] = useState("");

  // Check if user has emergency PIN and Google sign-in status
  useEffect(() => {
    const checkStatus = async () => {
      if (!user?.uid) return;

      const hasPinSet = await EmergencyPinDBService.hasEmergencyPin(user.uid);
      setHasEmergencyPin(hasPinSet);

      const { isSignedInWithGoogle: hasGoogle } = await checkGoogleSignIn();
      setIsSignedInWithGoogle(hasGoogle);
    };

    checkStatus();
  }, [user?.uid, isOpen]);

  const handleSubmit = async () => {
    if (!title.trim()) return;

    const totalSeconds = days * 86400 + hours * 3600;
    if (totalSeconds <= 0) return;

    // Validate hardcore mode requirements
    if (isHardcoreMode) {
      // If user doesn't have emergency PIN, they must set one
      if (!hasEmergencyPin) {
        if (!emergencyPin || emergencyPin.length < 4) {
          setPinError("Emergency PIN must be at least 4 characters");
          return;
        }
        if (emergencyPin !== confirmEmergencyPin) {
          setPinError("PINs do not match");
          return;
        }

        // Save the emergency PIN
        if (user?.uid) {
          try {
            await EmergencyPinDBService.setEmergencyPin(user.uid, emergencyPin);
          } catch {
            setPinError("Failed to save emergency PIN");
            return;
          }
        }
      }

      // If saving lock combination, require Google sign-in
      if (saveLockCombination && !isSignedInWithGoogle) {
        setPinError(
          "Google sign-in required to save lock combinations. Please sign in with Google first.",
        );
        return;
      }
    }

    onCreate(title.trim(), totalSeconds, description.trim() || undefined);

    // Reset form
    setTitle("");
    setDays(7);
    setHours(0);
    setDescription("");
    setIsHardcoreMode(false);
    setEmergencyPin("");
    setConfirmEmergencyPin("");
    setLockCombination("");
    setSaveLockCombination(false);
    setPinError("");
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTitle("");
    setDays(7);
    setHours(0);
    setDescription("");
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full glass-card p-6 hover:bg-white/10 transition-colors flex items-center justify-center gap-2 text-nightly-aquamarine font-semibold"
      >
        <FaPlus /> Create Personal Goal
      </button>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-nightly-honeydew">
          Create Personal Goal
        </h3>
        <button
          onClick={handleCancel}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-nightly-celadon"
        >
          <FaTimes />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-nightly-celadon mb-2">
            Goal Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-nightly-honeydew focus:outline-none focus:border-nightly-aquamarine"
            placeholder="e.g., 7 Day Challenge"
            disabled={isCreating}
          />
        </div>

        <div>
          <label className="block text-sm text-nightly-celadon mb-2">
            Target Duration
          </label>
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="number"
                min="0"
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value) || 0)}
                className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-nightly-honeydew focus:outline-none focus:border-nightly-aquamarine"
                placeholder="Days"
                disabled={isCreating}
              />
              <span className="text-xs text-nightly-celadon mt-1 block">
                Days
              </span>
            </div>
            <div className="flex-1">
              <input
                type="number"
                min="0"
                max="23"
                value={hours}
                onChange={(e) => setHours(parseInt(e.target.value) || 0)}
                className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-nightly-honeydew focus:outline-none focus:border-nightly-aquamarine"
                placeholder="Hours"
                disabled={isCreating}
              />
              <span className="text-xs text-nightly-celadon mt-1 block">
                Hours
              </span>
            </div>
          </div>
          <p className="text-xs text-nightly-celadon mt-2">
            Total: {days > 0 && `${days} days`} {hours > 0 && `${hours} hours`}
          </p>
        </div>

        <div>
          <label className="block text-sm text-nightly-celadon mb-2">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-nightly-honeydew focus:outline-none focus:border-nightly-aquamarine resize-none"
            rows={3}
            placeholder="What's your motivation for this goal?"
            disabled={isCreating}
          />
        </div>

        {/* Hardcore Mode Toggle */}
        <div className="border-t border-white/10 pt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FaLock className="text-red-400" />
              <label className="text-sm font-medium text-nightly-celadon">
                Hardcore Mode
              </label>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isHardcoreMode}
                onChange={(e) => setIsHardcoreMode(e.target.checked)}
                className="sr-only peer"
                disabled={isCreating}
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
            </label>
          </div>
          <p className="text-xs text-nightly-celadon/70 mb-3">
            Hardcore mode prevents early unlock and requires emergency PIN for
            safety.
          </p>

          {/* Hardcore Mode Options */}
          {isHardcoreMode && (
            <div className="space-y-4 bg-red-500/5 border border-red-500/20 rounded-lg p-4">
              {/* Emergency PIN Setup (if not already set) */}
              {!hasEmergencyPin && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-red-400">
                    <FaShieldAlt />
                    <span className="text-sm font-semibold">
                      Set Emergency PIN
                    </span>
                  </div>
                  <p className="text-xs text-nightly-celadon">
                    Required for hardcore mode safety. This PIN allows emergency
                    unlock if truly needed.
                  </p>
                  <input
                    type="password"
                    value={emergencyPin}
                    onChange={(e) => {
                      setEmergencyPin(e.target.value);
                      setPinError("");
                    }}
                    placeholder="Enter 4+ character PIN"
                    className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-nightly-honeydew focus:outline-none focus:border-red-500 font-mono"
                    disabled={isCreating}
                  />
                  <input
                    type="password"
                    value={confirmEmergencyPin}
                    onChange={(e) => {
                      setConfirmEmergencyPin(e.target.value);
                      setPinError("");
                    }}
                    placeholder="Confirm PIN"
                    className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-nightly-honeydew focus:outline-none focus:border-red-500 font-mono"
                    disabled={isCreating}
                  />
                </div>
              )}

              {hasEmergencyPin && (
                <div className="bg-green-500/10 border border-green-500/30 rounded p-3">
                  <div className="flex items-center gap-2 text-green-400 text-sm">
                    <FaShieldAlt />
                    <span>Emergency PIN already set</span>
                  </div>
                </div>
              )}

              {/* Lock Combination Option */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-nightly-celadon">
                    Save Lock Combination (Optional)
                  </label>
                  <input
                    type="checkbox"
                    checked={saveLockCombination}
                    onChange={(e) => setSaveLockCombination(e.target.checked)}
                    className="rounded"
                    disabled={isCreating}
                  />
                </div>

                {saveLockCombination && (
                  <>
                    {!isSignedInWithGoogle && (
                      <div className="bg-yellow-900/20 border border-yellow-600/30 rounded p-3">
                        <div className="flex items-start gap-2">
                          <FaExclamationTriangle className="text-yellow-400 mt-0.5" />
                          <div className="text-xs text-yellow-300">
                            <p className="font-semibold mb-1">
                              Google Sign-In Required
                            </p>
                            <p>
                              Lock combination storage requires Google
                              authentication to prevent data loss. Please sign
                              in with Google first.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {isSignedInWithGoogle && (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={lockCombination}
                          onChange={(e) => setLockCombination(e.target.value)}
                          placeholder="e.g., 4-2-8-1 or BLUE-RED-GREEN"
                          className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-nightly-honeydew focus:outline-none focus:border-red-500"
                          disabled={isCreating}
                        />
                        <p className="text-xs text-nightly-celadon/70">
                          Your physical lock combination will be encrypted and
                          saved securely.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Liability Disclaimer */}
              <div className="bg-yellow-900/10 border border-yellow-600/20 rounded p-3">
                <div className="flex items-start gap-2">
                  <FaExclamationTriangle className="text-yellow-400 text-sm mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-yellow-300">
                    <p className="font-semibold mb-1">Important Disclaimer</p>
                    <p>
                      Lock combinations are encrypted and stored securely, but
                      we are <strong>NOT liable</strong> if they are lost. Use
                      at your own risk. Always have a backup key or emergency
                      plan.
                    </p>
                  </div>
                </div>
              </div>

              {/* PIN Error Display */}
              {pinError && (
                <div className="bg-red-500/20 border border-red-500 rounded p-3">
                  <p className="text-red-400 text-xs">{pinError}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={isCreating || !title.trim() || (days === 0 && hours === 0)}
          className="w-full bg-nightly-aquamarine/20 border border-nightly-aquamarine hover:bg-nightly-aquamarine/30 text-nightly-aquamarine font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isCreating ? (
            "Creating..."
          ) : (
            <>
              <FaPlus /> Create Goal
            </>
          )}
        </button>
      </div>
    </div>
  );
};
