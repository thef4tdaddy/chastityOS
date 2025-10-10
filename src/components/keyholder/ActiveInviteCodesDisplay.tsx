import React from "react";
import { FaCopy, FaTrash } from "../../utils/iconImport";
import { formatDistanceToNow } from "date-fns";

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
  if (activeInviteCodes.length === 0) return null;

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-purple-500/30">
      <h3 className="font-semibold text-purple-300 mb-3">
        Active Invite Codes
      </h3>
      <div className="space-y-2">
        {activeInviteCodes.map((invite) => (
          <div
            key={invite.id}
            className="flex items-center justify-between p-2 bg-gray-700 rounded"
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
              <button
                onClick={() => onCopyCode(invite.code)}
                className="text-purple-400 hover:text-purple-300 p-1"
                title="Copy code"
              >
                <FaCopy />
              </button>
              <button
                onClick={() => onRevokeCode(invite.id)}
                className="text-red-400 hover:text-red-300 p-1"
                title="Revoke code"
              >
                <FaTrash />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActiveInviteCodesDisplay;
