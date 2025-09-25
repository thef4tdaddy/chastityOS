/**
 * Account Linking Component
 * Manages keyholder-submissive relationship creation and management
 */
import React, { useState } from "react";
import {
  FaKey,
  FaLink,
  FaUser,
  FaUserShield,
  FaCopy,
  FaTrash,
  FaExclamationTriangle,
} from "react-icons/fa";
import { useKeyholderRelationships } from "../../hooks/useKeyholderRelationships";
import { KeyholderPermissions } from "../../types/core";
import { formatDistanceToNow } from "date-fns";

interface AccountLinkingProps {
  className?: string;
}

export const AccountLinking: React.FC<AccountLinkingProps> = ({
  className = "",
}) => {
  const {
    relationships,
    activeKeyholder,
    activeInviteCodes,
    relationshipSummary,
    isLoading,
    isCreatingInvite,
    isAcceptingInvite,
    inviteCodeInput,
    keyholderNameInput,
    message,
    messageType,
    createInviteCode,
    acceptInviteCode,
    revokeInviteCode,
    endRelationship,
    setInviteCodeInput,
    setKeyholderNameInput,
    clearMessage,
    validateInviteCode,
  } = useKeyholderRelationships();

  const [showCreateInvite, setShowCreateInvite] = useState(false);
  const [showAcceptInvite, setShowAcceptInvite] = useState(false);
  const [showPermissions, setShowPermissions] = useState<string | null>(null);

  const handleCreateInvite = async () => {
    const inviteCode = await createInviteCode(24); // 24 hour expiration
    if (inviteCode) {
      setShowCreateInvite(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!validateInviteCode(inviteCodeInput)) {
      return;
    }

    const success = await acceptInviteCode(inviteCodeInput, keyholderNameInput);
    if (success) {
      setShowAcceptInvite(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
  };

  if (isLoading) {
    return (
      <div className={`${className} animate-pulse`}>
        <div className="bg-gray-700 p-4 rounded-lg">
          <div className="h-6 bg-gray-600 rounded mb-4"></div>
          <div className="h-4 bg-gray-600 rounded mb-2"></div>
          <div className="h-4 bg-gray-600 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-purple-300 mb-2">
          <FaLink className="inline mr-2" />
          Account Linking
        </h2>
        <p className="text-purple-400 text-sm">
          Connect with keyholders or submissives for enhanced control and
          oversight
        </p>
      </div>

      {/* Messages */}
      {message && (
        <div
          className={`p-3 rounded-lg border ${
            messageType === "success"
              ? "bg-green-900/50 border-green-500 text-green-300"
              : messageType === "error"
                ? "bg-red-900/50 border-red-500 text-red-300"
                : "bg-blue-900/50 border-blue-500 text-blue-300"
          }`}
        >
          <div className="flex justify-between items-start">
            <p className="text-sm">{message}</p>
            <button
              onClick={clearMessage}
              className="text-current opacity-70 hover:opacity-100 ml-2"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Relationship Summary */}
      {relationshipSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* As Submissive */}
          <div className="bg-gray-800 rounded-lg p-4 border border-purple-500/30">
            <div className="flex items-center mb-2">
              <FaUser className="text-purple-400 mr-2" />
              <h3 className="font-semibold text-purple-300">As Submissive</h3>
            </div>
            {relationshipSummary.hasActiveKeyholder ? (
              <div className="text-green-400 text-sm">
                ✓ Linked with keyholder
              </div>
            ) : (
              <div className="text-gray-400 text-sm">No active keyholder</div>
            )}
          </div>

          {/* As Keyholder */}
          <div className="bg-gray-800 rounded-lg p-4 border border-purple-500/30">
            <div className="flex items-center mb-2">
              <FaUserShield className="text-purple-400 mr-2" />
              <h3 className="font-semibold text-purple-300">As Keyholder</h3>
            </div>
            <div className="text-sm text-gray-300">
              {relationshipSummary.submissiveCount} submissive(s)
            </div>
          </div>
        </div>
      )}

      {/* Active Keyholder Relationship */}
      {activeKeyholder && (
        <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-lg p-4 border border-purple-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-purple-300 flex items-center">
              <FaKey className="mr-2" />
              Your Keyholder
            </h3>
            <button
              onClick={() =>
                setShowPermissions(
                  showPermissions === activeKeyholder.id
                    ? null
                    : activeKeyholder.id,
                )
              }
              className="text-purple-400 hover:text-purple-300 text-sm"
            >
              {showPermissions === activeKeyholder.id ? "Hide" : "View"}{" "}
              Permissions
            </button>
          </div>

          <div className="text-sm text-gray-300 mb-3">
            <p>
              Connected:{" "}
              {formatDistanceToNow(
                activeKeyholder.acceptedAt || activeKeyholder.createdAt,
              )}{" "}
              ago
            </p>
            <p>
              Status: <span className="text-green-400">Active</span>
            </p>
          </div>

          {showPermissions === activeKeyholder.id && (
            <div className="mt-3 p-3 bg-gray-700 rounded border">
              <h4 className="font-medium text-purple-300 mb-2">
                Keyholder Permissions
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(activeKeyholder.permissions).map(
                  ([key, value]) => (
                    <div key={key} className="flex items-center">
                      <span
                        className={value ? "text-green-400" : "text-red-400"}
                      >
                        {value ? "✓" : "✗"}
                      </span>
                      <span className="ml-2 text-gray-300">
                        {key
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (str) => str.toUpperCase())}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => endRelationship(activeKeyholder.id)}
              className="text-red-400 hover:text-red-300 text-sm px-3 py-1 border border-red-500 rounded hover:bg-red-900/30 transition-colors"
            >
              End Relationship
            </button>
          </div>
        </div>
      )}

      {/* Create Invite Code Section */}
      {!relationshipSummary?.hasActiveKeyholder && (
        <div className="bg-gray-800 rounded-lg p-4 border border-purple-500/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-purple-300">
              Create Invite Code
            </h3>
            <button
              onClick={() => setShowCreateInvite(!showCreateInvite)}
              className="text-purple-400 hover:text-purple-300 text-sm"
            >
              {showCreateInvite ? "Cancel" : "Create Code"}
            </button>
          </div>

          {showCreateInvite && (
            <div className="space-y-3">
              <p className="text-sm text-gray-400">
                Generate an invite code for a keyholder to link to your account.
              </p>
              <button
                onClick={handleCreateInvite}
                disabled={isCreatingInvite}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white py-2 px-4 rounded transition-colors"
              >
                {isCreatingInvite ? "Creating..." : "Generate Invite Code"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Active Invite Codes */}
      {activeInviteCodes.length > 0 && (
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
                    onClick={() => copyToClipboard(invite.code)}
                    className="text-purple-400 hover:text-purple-300 p-1"
                    title="Copy code"
                  >
                    <FaCopy />
                  </button>
                  <button
                    onClick={() => revokeInviteCode(invite.id)}
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
      )}

      {/* Accept Invite Code Section */}
      <div className="bg-gray-800 rounded-lg p-4 border border-purple-500/30">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-purple-300">Accept Invite Code</h3>
          <button
            onClick={() => setShowAcceptInvite(!showAcceptInvite)}
            className="text-purple-400 hover:text-purple-300 text-sm"
          >
            {showAcceptInvite ? "Cancel" : "Enter Code"}
          </button>
        </div>

        {showAcceptInvite && (
          <div className="space-y-3">
            <p className="text-sm text-gray-400">
              Enter an invite code from a submissive to become their keyholder.
            </p>
            <input
              type="text"
              value={inviteCodeInput}
              onChange={(e) => setInviteCodeInput(e.target.value)}
              placeholder="Enter 6-character code"
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 font-mono text-center tracking-wider"
              maxLength={6}
            />
            <input
              type="text"
              value={keyholderNameInput}
              onChange={(e) => setKeyholderNameInput(e.target.value)}
              placeholder="Your name (optional)"
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400"
            />
            <button
              onClick={handleAcceptInvite}
              disabled={
                isAcceptingInvite || !validateInviteCode(inviteCodeInput)
              }
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white py-2 px-4 rounded transition-colors"
            >
              {isAcceptingInvite ? "Accepting..." : "Accept Invite Code"}
            </button>
          </div>
        )}
      </div>

      {/* Submissive Relationships */}
      {relationships.asKeyholder.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4 border border-purple-500/30">
          <h3 className="font-semibold text-purple-300 mb-3">
            Your Submissives
          </h3>
          <div className="space-y-2">
            {relationships.asKeyholder.map((relationship) => (
              <div
                key={relationship.id}
                className="p-3 bg-gray-700 rounded border"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm">
                    <div className="text-green-400">Active Submissive</div>
                    <div className="text-xs text-gray-400">
                      Connected:{" "}
                      {formatDistanceToNow(
                        relationship.acceptedAt || relationship.createdAt,
                      )}{" "}
                      ago
                    </div>
                  </div>
                  <button
                    onClick={() => endRelationship(relationship.id)}
                    className="text-red-400 hover:text-red-300 text-sm px-2 py-1 border border-red-500 rounded hover:bg-red-900/30"
                  >
                    End
                  </button>
                </div>
                <div className="text-xs text-gray-400">
                  Permissions:{" "}
                  {
                    Object.values(relationship.permissions).filter(Boolean)
                      .length
                  }{" "}
                  of {Object.keys(relationship.permissions).length} granted
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4">
        <div className="flex items-start">
          <FaExclamationTriangle className="text-blue-400 mt-1 mr-2 flex-shrink-0" />
          <div className="text-sm text-blue-300">
            <h4 className="font-medium mb-1">About Account Linking</h4>
            <ul className="space-y-1 text-xs text-blue-200">
              <li>
                • Submissives can create invite codes for keyholders to accept
              </li>
              <li>
                • Only one active keyholder per submissive currently supported
              </li>
              <li>• Invite codes expire after 24 hours</li>
              <li>• Either party can end the relationship at any time</li>
              <li>• Submissives control what permissions keyholders have</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountLinking;
