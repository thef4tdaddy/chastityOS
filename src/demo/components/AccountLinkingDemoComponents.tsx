/**
 * Account Linking Demo Sub-Components
 * Reusable components extracted from AccountLinkingDemo
 */

import React from "react";
import {
  FaKey,
  FaCopy,
  FaTrash,
  FaExclamationTriangle,
} from "../../utils/iconImport";
import { formatDistanceToNow } from "date-fns";
import {
  AdminRelationship,
  AdminPermissions,
  LinkCode,
} from "@/types/account-linking";
import { Input } from "@/components/ui";

interface MessageDisplayProps {
  message: string;
  messageType: string;
  clearMessage: () => void;
}

export const MessageDisplay: React.FC<MessageDisplayProps> = ({
  message,
  messageType,
  clearMessage,
}) => {
  if (!message) return null;

  return (
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
        <Button
          onClick={clearMessage}
          className="text-current opacity-70 hover:opacity-100 ml-2"
        >
          ×
        </Button>
      </div>
    </div>
  );
};

interface ActiveKeyholderProps {
  activeKeyholder: AdminRelationship;
  showPermissions: string | null;
  setShowPermissions: (id: string | null) => void;
}

export const ActiveKeyholder: React.FC<ActiveKeyholderProps> = ({
  activeKeyholder,
  showPermissions,
  setShowPermissions,
}) => {
  if (!activeKeyholder) return null;

  return (
    <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-lg p-4 border border-purple-500">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-purple-300 flex items-center">
          <FaKey className="mr-2" />
          Your Keyholder
        </h3>
        <Button
          onClick={() =>
            setShowPermissions(
              showPermissions === activeKeyholder.id
                ? null
                : activeKeyholder.id,
            )
          }
          className="text-purple-400 hover:text-purple-300 text-sm"
        >
          {showPermissions === activeKeyholder.id ? "Hide" : "View"} Permissions
        </Button>
      </div>

      <KeyholderInfo activeKeyholder={activeKeyholder} />

      {showPermissions === activeKeyholder.id && (
        <PermissionsDisplay permissions={activeKeyholder.permissions} />
      )}

      <div className="mt-3 flex gap-2">
        <Button className="text-red-400 hover:text-red-300 text-sm px-3 py-1 border border-red-500 rounded hover:bg-red-900/30 transition-colors">
          End Relationship
        </Button>
      </div>
    </div>
  );
};

const KeyholderInfo: React.FC<{ activeKeyholder: AdminRelationship }> = ({
  activeKeyholder,
}) => (
  <div className="text-sm text-gray-300 mb-3">
    <p>
      Connected: {formatDistanceToNow(activeKeyholder.establishedAt.toDate())}{" "}
      ago
    </p>
    <p>
      Status: <span className="text-green-400">Active</span>
    </p>
  </div>
);

const PermissionsDisplay: React.FC<{ permissions: AdminPermissions }> = ({
  permissions,
}) => (
  <div className="mt-3 p-3 bg-gray-700 rounded border">
    <h4 className="font-medium text-purple-300 mb-2">Keyholder Permissions</h4>
    <div className="grid grid-cols-2 gap-2 text-xs">
      {Object.entries(permissions).map(([key, value]) => (
        <div key={key} className="flex items-center">
          <span className={value ? "text-green-400" : "text-red-400"}>
            {value ? "✓" : "✗"}
          </span>
          <span className="ml-2 text-gray-300">
            {key
              .replace(/([A-Z])/g, " $1")
              .replace(/^./, (str) => str.toUpperCase())}
          </span>
        </div>
      ))}
    </div>
  </div>
);

interface CreateInviteSectionProps {
  hasActiveKeyholder: boolean;
  showCreateInvite: boolean;
  setShowCreateInvite: (show: boolean) => void;
  handleCreateInvite: () => void;
}

export const CreateInviteSection: React.FC<CreateInviteSectionProps> = ({
  hasActiveKeyholder,
  showCreateInvite,
  setShowCreateInvite,
  handleCreateInvite,
}) => {
  if (hasActiveKeyholder) return null;

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-purple-500/30">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-purple-300">Create Invite Code</h3>
        <Button
          onClick={() => setShowCreateInvite(!showCreateInvite)}
          className="text-purple-400 hover:text-purple-300 text-sm"
        >
          {showCreateInvite ? "Cancel" : "Create Code"}
        </Button>
      </div>
      {showCreateInvite && (
        <div className="space-y-3">
          <p className="text-sm text-gray-400">
            Generate an invite code for a keyholder to link to your account.
          </p>
          <Button
            onClick={handleCreateInvite}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded transition-colors"
          >
            Generate Invite Code
          </Button>
        </div>
      )}
    </div>
  );
};

interface ActiveInviteCodesProps {
  activeInviteCodes: LinkCode[];
  copyToClipboard: (text: string) => void;
}

export const ActiveInviteCodes: React.FC<ActiveInviteCodesProps> = ({
  activeInviteCodes,
  copyToClipboard,
}) => {
  if (activeInviteCodes.length === 0) return null;

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-purple-500/30">
      <h3 className="font-semibold text-purple-300 mb-3">
        Active Invite Codes ({activeInviteCodes.length})
      </h3>
      <div className="space-y-2">
        {activeInviteCodes.map((invite) => (
          <InviteCodeCard
            key={invite.id}
            invite={invite}
            copyToClipboard={copyToClipboard}
          />
        ))}
      </div>
    </div>
  );
};

const InviteCodeCard: React.FC<{
  invite: LinkCode;
  copyToClipboard: (text: string) => void;
}> = ({ invite, copyToClipboard }) => (
  <div className="p-3 bg-gray-700 rounded border flex items-center justify-between">
    <div>
      <div className="font-mono text-purple-300 font-bold text-lg">
        {invite.id}
      </div>
      <div className="text-xs text-gray-400">
        <div>Created: {formatDistanceToNow(invite.createdAt.toDate())} ago</div>
        <div>
          Expires: {formatDistanceToNow(invite.expiresAt.toDate())} from now
        </div>
      </div>
    </div>
    <div className="flex gap-2">
      <Button
        onClick={() => copyToClipboard(invite.id)}
        className="text-purple-400 hover:text-purple-300 p-1"
        title="Copy code"
      >
        <FaCopy />
      </Button>
      <Button
        className="text-red-400 hover:text-red-300 p-1"
        title="Revoke code"
      >
        <FaTrash />
      </Button>
    </div>
  </div>
);

interface AcceptInviteSectionProps {
  showAcceptInvite: boolean;
  setShowAcceptInvite: (show: boolean) => void;
  inviteCodeInput: string;
  setInviteCodeInput: (value: string) => void;
  keyholderNameInput: string;
  setKeyholderNameInput: (value: string) => void;
  handleAcceptInvite: () => void;
}

export const AcceptInviteSection: React.FC<AcceptInviteSectionProps> = ({
  showAcceptInvite,
  setShowAcceptInvite,
  inviteCodeInput,
  setInviteCodeInput,
  keyholderNameInput,
  setKeyholderNameInput,
  handleAcceptInvite,
}) => (
  <div className="bg-gray-800 rounded-lg p-4 border border-purple-500/30">
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-semibold text-purple-300">Accept Invite Code</h3>
      <Button
        onClick={() => setShowAcceptInvite(!showAcceptInvite)}
        className="text-purple-400 hover:text-purple-300 text-sm"
      >
        {showAcceptInvite ? "Cancel" : "Enter Code"}
      </Button>
    </div>
    {showAcceptInvite && (
      <div className="space-y-3">
        <p className="text-sm text-gray-400">
          Enter an invite code from a submissive to become their keyholder.
        </p>
        <Input
          type="text"
          value={inviteCodeInput}
          onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
          placeholder="Enter 6-character code"
          maxLength={6}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 font-mono text-center tracking-wider"
        />
        <Input
          type="text"
          value={keyholderNameInput}
          onChange={(e) => setKeyholderNameInput(e.target.value)}
          placeholder="Your name (optional)"
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400"
        />
        <Button
          onClick={handleAcceptInvite}
          disabled={inviteCodeInput.length !== 6}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white py-2 px-4 rounded transition-colors"
        >
          Accept Invite Code
        </Button>
      </div>
    )}
  </div>
);

interface SubmissiveRelationshipsProps {
  relationships: { asKeyholder: AdminRelationship[] };
}

export const SubmissiveRelationships: React.FC<
  SubmissiveRelationshipsProps
> = ({ relationships }) => {
  if (relationships.asKeyholder.length === 0) return null;

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-purple-500/30">
      <h3 className="font-semibold text-purple-300 mb-3">Your Submissives</h3>
      <div className="space-y-2">
        {relationships.asKeyholder.map((relationship: AdminRelationship) => (
          <SubmissiveCard key={relationship.id} relationship={relationship} />
        ))}
      </div>
    </div>
  );
};

const SubmissiveCard: React.FC<{ relationship: AdminRelationship }> = ({
  relationship,
}) => (
  <div className="p-3 bg-gray-700 rounded border">
    <div className="flex items-center justify-between mb-2">
      <div className="text-sm">
        <div className="text-green-400">Active Submissive</div>
        <div className="text-xs text-gray-400">
          Connected: {formatDistanceToNow(relationship.establishedAt.toDate())}{" "}
          ago
        </div>
      </div>
      <Button className="text-red-400 hover:text-red-300 text-sm px-2 py-1 border border-red-500 rounded hover:bg-red-900/30">
        End
      </Button>
    </div>
    <div className="text-xs text-gray-400">
      Permissions:{" "}
      {Object.values(relationship.permissions).filter(Boolean).length} of{" "}
      {Object.keys(relationship.permissions).length} granted
    </div>
  </div>
);

export const HelpSection: React.FC = () => (
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
);
