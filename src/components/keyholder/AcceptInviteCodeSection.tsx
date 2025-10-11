import React, { useState } from "react";
import { Input, Button } from "@/components/ui";

interface AcceptInviteCodeSectionProps {
  inviteCodeInput: string;
  keyholderNameInput: string;
  isAcceptingInvite: boolean;
  onSetInviteCodeInput: (value: string) => void;
  onSetKeyholderNameInput: (value: string) => void;
  onAcceptInvite: () => Promise<void>;
  validateInviteCode: (code: string) => boolean;
  disabled?: boolean;
}

export const AcceptInviteCodeSection: React.FC<
  AcceptInviteCodeSectionProps
> = ({
  inviteCodeInput,
  keyholderNameInput,
  isAcceptingInvite,
  onSetInviteCodeInput,
  onSetKeyholderNameInput,
  onAcceptInvite,
  validateInviteCode,
  disabled = false,
}) => {
  const [showAcceptInvite, setShowAcceptInvite] = useState(false);

  const handleAcceptInvite = async () => {
    if (disabled) return;
    await onAcceptInvite();
    setShowAcceptInvite(false);
  };

  return (
    <div
      className={`bg-gray-800 rounded-lg p-4 border border-purple-500/30 relationship-card-interactive ${disabled ? "opacity-60" : ""}`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-purple-300">Accept Invite Code</h3>
        <Button
          onClick={() => !disabled && setShowAcceptInvite(!showAcceptInvite)}
          disabled={disabled}
          className="text-purple-400 hover:text-purple-300 text-sm disabled:cursor-not-allowed disabled:opacity-50 relationship-transition-fast"
        >
          {showAcceptInvite ? "Cancel" : "Enter Code"}
        </Button>
      </div>

      {showAcceptInvite && (
        <div className="space-y-3 invitation-form-expand">
          <p className="text-sm text-gray-400">
            Enter an invite code from a submissive to become their keyholder.
          </p>
          <Input
            type="text"
            value={inviteCodeInput}
            onChange={(e) => onSetInviteCodeInput(e.target.value)}
            placeholder="Enter 6-character code"
            disabled={disabled}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 font-mono text-center tracking-wider disabled:cursor-not-allowed disabled:opacity-50 relationship-transition"
            maxLength={6}
          />
          <Input
            type="text"
            value={keyholderNameInput}
            onChange={(e) => onSetKeyholderNameInput(e.target.value)}
            placeholder="Your name (optional)"
            disabled={disabled}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 disabled:cursor-not-allowed disabled:opacity-50 relationship-transition"
          />
          <Button
            onClick={handleAcceptInvite}
            disabled={
              disabled ||
              isAcceptingInvite ||
              !validateInviteCode(inviteCodeInput)
            }
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white py-2 px-4 rounded relationship-transition disabled:cursor-not-allowed"
          >
            {isAcceptingInvite ? "Accepting..." : "Accept Invite Code"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default AcceptInviteCodeSection;
