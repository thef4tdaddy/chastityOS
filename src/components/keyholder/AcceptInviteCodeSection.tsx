import React, { useState } from "react";
import { Input, Button } from "@/components/ui";
import { ErrorMessage } from "../errors/fallbacks/ErrorMessage";

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
  const [error, setError] = useState<string | null>(null);

  const handleAcceptInvite = async () => {
    if (disabled) return;
    try {
      setError(null);
      await onAcceptInvite();
      setShowAcceptInvite(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to accept invite code";
      setError(errorMessage);
    }
  };

  return (
    <section
      className={`bg-gray-800 rounded-lg p-4 border border-purple-500/30 relationship-card-interactive ${disabled ? "opacity-60" : ""}`}
      role="region"
      aria-labelledby="accept-invite-heading"
      aria-disabled={disabled}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 id="accept-invite-heading" className="font-semibold text-purple-300">Accept Invite Code</h3>
        <Button
          onClick={() => !disabled && setShowAcceptInvite(!showAcceptInvite)}
          disabled={disabled}
          aria-expanded={showAcceptInvite}
          aria-controls="accept-invite-form"
          aria-label={showAcceptInvite ? "Cancel accepting invite code" : "Show invite code form"}
          className="text-purple-400 hover:text-purple-300 text-sm disabled:cursor-not-allowed disabled:opacity-50 relationship-transition-fast"
        >
          {showAcceptInvite ? "Cancel" : "Enter Code"}
        </Button>
      </div>

      {showAcceptInvite && (
        <div id="accept-invite-form" className="space-y-3 invitation-form-expand" role="form" aria-labelledby="accept-invite-heading">
          <p className="text-sm text-gray-400">
            Enter an invite code from a submissive to become their keyholder.
          </p>
          {error && (
            <ErrorMessage
              message={error}
              onDismiss={() => setError(null)}
              variant="error"
            />
          )}
          <div>
            <label htmlFor="invite-code-input" className="sr-only">
              Invite code (6 characters)
            </label>
            <Input
              id="invite-code-input"
              type="text"
              value={inviteCodeInput}
              onChange={(e) => onSetInviteCodeInput(e.target.value)}
              placeholder="Enter 6-character code"
              disabled={disabled}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 font-mono text-center tracking-wider disabled:cursor-not-allowed disabled:opacity-50 relationship-transition"
              maxLength={6}
              aria-required="true"
              aria-describedby="invite-code-help"
              autoComplete="off"
            />
            <span id="invite-code-help" className="sr-only">
              Enter the 6-character invite code shared by the submissive
            </span>
          </div>
          <div>
            <label htmlFor="keyholder-name-input" className="sr-only">
              Your name (optional)
            </label>
            <Input
              id="keyholder-name-input"
              type="text"
              value={keyholderNameInput}
              onChange={(e) => onSetKeyholderNameInput(e.target.value)}
              placeholder="Your name (optional)"
              disabled={disabled}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 disabled:cursor-not-allowed disabled:opacity-50 relationship-transition"
              autoComplete="name"
            />
          </div>
          <Button
            onClick={handleAcceptInvite}
            disabled={
              disabled ||
              isAcceptingInvite ||
              !validateInviteCode(inviteCodeInput)
            }
            aria-label={isAcceptingInvite ? "Accepting invite code" : "Accept invite code"}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white py-2 px-4 rounded relationship-transition disabled:cursor-not-allowed"
          >
            {isAcceptingInvite ? "Accepting..." : "Accept Invite Code"}
          </Button>
        </div>
      )}
    </section>
  );
};

export default AcceptInviteCodeSection;
