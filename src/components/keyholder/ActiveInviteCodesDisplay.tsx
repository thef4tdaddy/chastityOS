import React, { useState } from "react";
import { Button } from "@/components/ui";
import { FaCopy, FaTrash } from "../../utils/iconImport";
import { formatDistanceToNow } from "date-fns";
import { ErrorMessage } from "../errors/fallbacks/ErrorMessage";

interface InviteCode {
  id: string;
  code: string;
  expiresAt: Date;
}

interface ActiveInviteCodesDisplayProps {
  activeInviteCodes: InviteCode[];
  onCopyCode: (code: string) => Promise<void>;
  onRevokeCode: (id: string) => void;
}

export const ActiveInviteCodesDisplay: React.FC<
  ActiveInviteCodesDisplayProps
> = ({ activeInviteCodes, onCopyCode, onRevokeCode }) => {
  const [error, setError] = useState<string | null>(null);

  if (activeInviteCodes.length === 0) return null;

  const handleCopyCode = async (code: string) => {
    try {
      setError(null);
      await onCopyCode(code);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to copy code";
      setError(errorMessage);
    }
  };

  const handleRevokeCode = (id: string) => {
    try {
      setError(null);
      onRevokeCode(id);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to revoke code";
      setError(errorMessage);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-purple-500/30 relationship-card-interactive">
      <h3 className="font-semibold text-purple-300 mb-3">
        Active Invite Codes
      </h3>
      {error && (
        <ErrorMessage
          message={error}
          onDismiss={() => setError(null)}
          variant="error"
        />
      )}
      <div className="space-y-2">
        {activeInviteCodes.map((invite, index) => (
          <div
            key={invite.id}
            className="flex items-center justify-between p-2 bg-gray-700 rounded invite-code-appear relationship-transition"
            style={{ animationDelay: `${index * 75}ms` }}
          >
            <div>
              <div className="font-mono text-lg text-green-400">
                {invite.code}
              </div>
              <div className="text-xs text-gray-400">
                Expires: {formatDistanceToNow(invite.expiresAt)} from now
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => handleCopyCode(invite.code)}
                className="text-purple-400 hover:text-purple-300 p-1 icon-button"
                title="Copy code"
              >
                <FaCopy />
              </Button>
              <Button
                onClick={() => handleRevokeCode(invite.id)}
                className="text-red-400 hover:text-red-300 p-1 icon-button"
                title="Revoke code"
              >
                <FaTrash />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActiveInviteCodesDisplay;
