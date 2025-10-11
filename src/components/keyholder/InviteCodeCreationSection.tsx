import React, { useState } from "react";
import { Button } from "@/components/ui";

interface InviteCodeCreationSectionProps {
  shouldShow: boolean;
  isCreatingInvite: boolean;
  onCreateInvite: () => Promise<void>;
}

export const InviteCodeCreationSection: React.FC<
  InviteCodeCreationSectionProps
> = ({ shouldShow, isCreatingInvite, onCreateInvite }) => {
  const [showCreateInvite, setShowCreateInvite] = useState(false);

  if (!shouldShow) return null;

  const handleCreateInvite = async () => {
    await onCreateInvite();
    setShowCreateInvite(false);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-purple-500/30 relationship-card-interactive">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-purple-300">Create Invite Code</h3>
        <Button
          onClick={() => setShowCreateInvite(!showCreateInvite)}
          className="text-purple-400 hover:text-purple-300 text-sm relationship-transition-fast"
        >
          {showCreateInvite ? "Cancel" : "Create Code"}
        </Button>
      </div>

      {showCreateInvite && (
        <div className="space-y-3 invitation-form-expand">
          <p className="text-sm text-gray-400">
            Generate an invite code for a keyholder to link to your account.
          </p>
          <Button
            onClick={handleCreateInvite}
            disabled={isCreatingInvite}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white py-2 px-4 rounded relationship-transition"
          >
            {isCreatingInvite ? "Creating..." : "Generate Invite Code"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default InviteCodeCreationSection;
