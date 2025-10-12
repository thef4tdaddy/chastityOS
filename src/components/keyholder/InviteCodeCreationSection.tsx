import React, { useState } from "react";
import { Button } from "@/components/ui";
import { ErrorMessage } from "../errors/fallbacks/ErrorMessage";

interface InviteCodeCreationSectionProps {
  shouldShow: boolean;
  isCreatingInvite: boolean;
  onCreateInvite: () => Promise<void>;
}

export const InviteCodeCreationSection: React.FC<
  InviteCodeCreationSectionProps
> = ({ shouldShow, isCreatingInvite, onCreateInvite }) => {
  const [showCreateInvite, setShowCreateInvite] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!shouldShow) return null;

  const handleCreateInvite = async () => {
    try {
      setError(null);
      await onCreateInvite();
      setShowCreateInvite(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create invite code";
      setError(errorMessage);
    }
  };

  return (
    <section 
      className="bg-gray-800 rounded-lg p-4 border border-purple-500/30 relationship-card-interactive"
      role="region"
      aria-labelledby="invite-code-heading"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 id="invite-code-heading" className="font-semibold text-purple-300">Create Invite Code</h3>
        <Button
          onClick={() => {
            setShowCreateInvite(!showCreateInvite);
            setError(null);
          }}
          aria-expanded={showCreateInvite}
          aria-controls="invite-code-form"
          aria-label={showCreateInvite ? "Cancel invite code creation" : "Show invite code creation form"}
          className="text-purple-400 hover:text-purple-300 text-sm relationship-transition-fast"
        >
          {showCreateInvite ? "Cancel" : "Create Code"}
        </Button>
      </div>

      {showCreateInvite && (
        <div id="invite-code-form" className="space-y-3 invitation-form-expand">
          <p className="text-sm text-gray-400">
            Generate an invite code for a keyholder to link to your account.
          </p>
          {error && (
            <ErrorMessage
              message={error}
              onDismiss={() => setError(null)}
              variant="error"
            />
          )}
          <Button
            onClick={handleCreateInvite}
            disabled={isCreatingInvite}
            aria-label={isCreatingInvite ? "Creating invite code" : "Generate invite code"}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white py-2 px-4 rounded relationship-transition"
          >
            {isCreatingInvite ? "Creating..." : "Generate Invite Code"}
          </Button>
        </div>
      )}
    </section>
  );
};

export default InviteCodeCreationSection;
