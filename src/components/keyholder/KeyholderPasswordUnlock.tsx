import React from "react";
import { useKeyholderStore } from "../../stores/keyholderStore";
import { FaLock, FaUnlock, FaKey, FaSpinner } from "../../utils/iconImport";
import { Input, Button } from "@/components/ui";

// Password Form Component
const PasswordForm: React.FC<{
  passwordAttempt: string;
  keyholderMessage: string;
  isCheckingPassword: boolean;
  onPasswordChange: (password: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClearMessage: () => void;
}> = ({
  passwordAttempt,
  keyholderMessage,
  isCheckingPassword,
  onPasswordChange,
  onSubmit,
  onClearMessage,
}) => (
  <form onSubmit={onSubmit} className="space-y-3 sm:space-y-4">
    <div>
      <label className="block text-xs sm:text-sm font-medium text-nightly-celadon mb-2">
        Keyholder Password
      </label>
      <Input
        type="password"
        value={passwordAttempt}
        onChange={(e) => onPasswordChange(e.target.value)}
        placeholder="Enter keyholder password"
        className="w-full bg-white/5 border border-white/10 rounded p-3 text-sm sm:text-base text-nightly-honeydew placeholder-nightly-celadon/50"
        disabled={isCheckingPassword}
      />
    </div>

    {keyholderMessage && (
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-3">
        <p className="text-yellow-300 text-xs sm:text-sm break-words">
          {keyholderMessage}
        </p>
        <Button
          type="button"
          onClick={onClearMessage}
          className="text-yellow-400 hover:text-yellow-300 text-xs sm:text-sm mt-2 min-h-[44px] sm:min-h-0 py-2 sm:py-1 px-3 touch-manipulation"
        >
          Dismiss
        </Button>
      </div>
    )}

    <Button
      type="submit"
      disabled={isCheckingPassword || !passwordAttempt.trim()}
      className="w-full sm:w-auto bg-nightly-aquamarine hover:bg-nightly-aquamarine/80 disabled:opacity-50 text-black px-6 py-3 sm:py-2 rounded font-medium transition-colors flex items-center justify-center gap-2 min-h-[44px] sm:min-h-0 touch-manipulation"
    >
      {isCheckingPassword ? (
        <>
          <FaSpinner className="animate-spin flex-shrink-0" />
          <span>Checking...</span>
        </>
      ) : (
        <>
          <FaUnlock className="flex-shrink-0" />
          <span>Unlock</span>
        </>
      )}
    </Button>
  </form>
);

// Unlocked Status Component
const UnlockedStatus: React.FC = () => (
  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
    <div className="flex items-center gap-2 sm:gap-3">
      <FaUnlock className="text-green-400 flex-shrink-0" />
      <span className="text-green-400 font-medium text-sm sm:text-base">
        Keyholder Controls Unlocked
      </span>
    </div>
    <p className="text-nightly-celadon text-xs sm:text-sm mt-2">
      You have temporary admin access to this account's chastity controls.
    </p>
  </div>
);

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
    return <UnlockedStatus />;
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
      <div className="flex items-center gap-2 sm:gap-3 mb-4">
        <FaLock className="text-nightly-aquamarine flex-shrink-0" />
        <h2 className="text-lg sm:text-xl font-semibold text-nightly-honeydew">
          Temporary Keyholder Access
        </h2>
      </div>

      <p className="text-nightly-celadon text-xs sm:text-sm mb-4">
        This is the current temporary password-based keyholder system. In the
        future, this will be replaced with secure account linking.
      </p>

      {!isPasswordDialogOpen ? (
        <Button
          onClick={openPasswordDialog}
          className="w-full sm:w-auto bg-nightly-aquamarine hover:bg-nightly-aquamarine/80 text-black px-6 py-3 sm:py-2 rounded font-medium transition-colors flex items-center justify-center gap-2 min-h-[44px] sm:min-h-0 touch-manipulation"
        >
          <FaKey className="flex-shrink-0" />
          <span>Unlock Keyholder Controls</span>
        </Button>
      ) : (
        <PasswordForm
          passwordAttempt={passwordAttempt}
          keyholderMessage={keyholderMessage}
          isCheckingPassword={isCheckingPassword}
          onPasswordChange={setPasswordAttempt}
          onSubmit={handleSubmit}
          onClearMessage={clearMessage}
        />
      )}
    </div>
  );
};
