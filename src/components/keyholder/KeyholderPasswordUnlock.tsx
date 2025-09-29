import React from "react";
import { useKeyholderStore } from "../../stores/keyholderStore";
import { FaLock, FaUnlock, FaKey, FaSpinner } from "../../utils/iconImport";

// Password Unlock Component
export const KeyholderPasswordUnlock: React.FC = () => {
  // Selective subscriptions for specific state values
  const isKeyholderModeUnlocked = useKeyholderStore(
    (state) => state.isKeyholderModeUnlocked,
  );
  const isPasswordDialogOpen = useKeyholderStore(
    (state) => state.isPasswordDialogOpen,
  );
  const passwordAttempt = useKeyholderStore((state) => state.passwordAttempt);
  const keyholderMessage = useKeyholderStore((state) => state.keyholderMessage);
  const isCheckingPassword = useKeyholderStore(
    (state) => state.isCheckingPassword,
  );

  // Selective subscriptions for actions (stable references)
  const openPasswordDialog = useKeyholderStore(
    (state) => state.openPasswordDialog,
  );
  const setPasswordAttempt = useKeyholderStore(
    (state) => state.setPasswordAttempt,
  );
  const checkPassword = useKeyholderStore((state) => state.checkPassword);
  const clearMessage = useKeyholderStore((state) => state.clearMessage);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordAttempt.trim()) return;

    // For demo - in real app this would come from settings
    const storedHash = "demo_password_hash"; // This would be from user settings
    await checkPassword(passwordAttempt, storedHash);
  };

  if (isKeyholderModeUnlocked) {
    return (
      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <FaUnlock className="text-green-400" />
          <span className="text-green-400 font-medium">
            Keyholder Controls Unlocked
          </span>
        </div>
        <p className="text-nightly-celadon text-sm mt-2">
          You have temporary admin access to this account's chastity controls.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <FaLock className="text-nightly-aquamarine" />
        <h2 className="text-xl font-semibold text-nightly-honeydew">
          Temporary Keyholder Access
        </h2>
      </div>

      <p className="text-nightly-celadon mb-4">
        This is the current temporary password-based keyholder system. In the
        future, this will be replaced with secure account linking.
      </p>

      {!isPasswordDialogOpen ? (
        <button
          onClick={openPasswordDialog}
          className="bg-nightly-aquamarine hover:bg-nightly-aquamarine/80 text-black px-6 py-2 rounded font-medium transition-colors flex items-center gap-2"
        >
          <FaKey />
          Unlock Keyholder Controls
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-nightly-celadon mb-2">
              Keyholder Password
            </label>
            <input
              type="password"
              value={passwordAttempt}
              onChange={(e) => setPasswordAttempt(e.target.value)}
              placeholder="Enter keyholder password"
              className="w-full bg-white/5 border border-white/10 rounded p-3 text-nightly-honeydew placeholder-nightly-celadon/50"
              disabled={isCheckingPassword}
            />
          </div>

          {keyholderMessage && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-3">
              <p className="text-yellow-300 text-sm">{keyholderMessage}</p>
              <button
                type="button"
                onClick={clearMessage}
                className="text-yellow-400 hover:text-yellow-300 text-sm mt-1"
              >
                Dismiss
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={isCheckingPassword || !passwordAttempt.trim()}
            className="bg-nightly-aquamarine hover:bg-nightly-aquamarine/80 disabled:opacity-50 text-black px-6 py-2 rounded font-medium transition-colors flex items-center gap-2"
          >
            {isCheckingPassword ? (
              <>
                <FaSpinner className="animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <FaUnlock />
                Unlock
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};
