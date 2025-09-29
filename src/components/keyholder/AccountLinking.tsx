/**
 * Account Linking Component
 * Manages keyholder-submissive relationship creation and management
 */
import React from "react";
import { useKeyholderRelationships } from "../../hooks/useKeyholderRelationships";
import { getAccountLinkingState } from "./AccountLinkingHelpers";
import { AccountLinkingLoading } from "./AccountLinkingLoading";
import { AccountLinkingHeader } from "./AccountLinkingHeader";
import { LinkingMessageDisplay } from "./LinkingMessageDisplay";
import { RelationshipSummary } from "./RelationshipSummary";
import { ActiveKeyholderDisplay } from "./ActiveKeyholderDisplay";
import { InviteCodeCreationSection } from "./InviteCodeCreationSection";
import { ActiveInviteCodesDisplay } from "./ActiveInviteCodesDisplay";
import { AcceptInviteCodeSection } from "./AcceptInviteCodeSection";
import { SubmissiveRelationshipsDisplay } from "./SubmissiveRelationshipsDisplay";
import { AccountLinkingHelp } from "./AccountLinkingHelp";

interface AccountLinkingProps {
  className?: string;
}

// Helper functions to reduce complexity
const useAccountLinkingHandlers = (
  createInviteCode: (hours: number) => Promise<any>,
  acceptInviteCode: (code: string, name: string) => Promise<any>,
  validateInviteCode: (code: string) => boolean,
  inviteCodeInput: string,
  keyholderNameInput: string,
) => {
  const handleCreateInvite = async () => {
    await createInviteCode(24); // 24 hour expiration
  };

  const handleAcceptInvite = async () => {
    if (!validateInviteCode(inviteCodeInput)) {
      return;
    }
    await acceptInviteCode(inviteCodeInput, keyholderNameInput);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
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

  return { handleCreateInvite, handleAcceptInvite, copyToClipboard };
};

// Main Component Content
const AccountLinkingContent: React.FC<{
  relationships: any;
  activeKeyholder: any;
  activeInviteCodes: any;
  relationshipSummary: any;
  message: string;
  messageType: any;
  clearMessage: () => void;
  endRelationship: (id: string) => void;
  linkingState: any;
  isCreatingInvite: boolean;
  inviteCodeInput: string;
  keyholderNameInput: string;
  isAcceptingInvite: boolean;
  setInviteCodeInput: (code: string) => void;
  setKeyholderNameInput: (name: string) => void;
  revokeInviteCode: (id: string) => void;
  validateInviteCode: (code: string) => boolean;
  handlers: {
    handleCreateInvite: () => Promise<void>;
    handleAcceptInvite: () => Promise<void>;
    copyToClipboard: (text: string) => Promise<void>;
  };
}> = ({
  relationships,
  activeKeyholder,
  activeInviteCodes,
  relationshipSummary,
  message,
  messageType,
  clearMessage,
  endRelationship,
  linkingState,
  isCreatingInvite,
  inviteCodeInput,
  keyholderNameInput,
  isAcceptingInvite,
  setInviteCodeInput,
  setKeyholderNameInput,
  revokeInviteCode,
  validateInviteCode,
  handlers,
}) => (
  <div className="space-y-6">
    {/* Header */}
    <AccountLinkingHeader />

    {/* Messages */}
    <LinkingMessageDisplay
      message={message}
      messageType={messageType}
      onClearMessage={clearMessage}
    />

    {/* Relationship Summary */}
    <RelationshipSummary relationshipSummary={relationshipSummary} />

    {/* Active Keyholder Relationship */}
    {activeKeyholder && (
      <ActiveKeyholderDisplay
        activeKeyholder={{
          ...activeKeyholder,
          permissions: activeKeyholder.permissions as unknown as Record<
            string,
            boolean
          >,
        }}
        onEndRelationship={endRelationship}
      />
    )}

    {/* Create Invite Code Section */}
    <InviteCodeCreationSection
      shouldShow={!linkingState.hasActiveKeyholder}
      isCreatingInvite={isCreatingInvite}
      onCreateInvite={handlers.handleCreateInvite}
    />

    {/* Active Invite Codes */}
    <ActiveInviteCodesDisplay
      activeInviteCodes={activeInviteCodes}
      onCopyCode={handlers.copyToClipboard}
      onRevokeCode={revokeInviteCode}
    />

    {/* Accept Invite Code Section */}
    <AcceptInviteCodeSection
      inviteCodeInput={inviteCodeInput}
      keyholderNameInput={keyholderNameInput}
      isAcceptingInvite={isAcceptingInvite}
      onSetInviteCodeInput={setInviteCodeInput}
      onSetKeyholderNameInput={setKeyholderNameInput}
      onAcceptInvite={handlers.handleAcceptInvite}
      validateInviteCode={validateInviteCode}
    />

    {/* Submissive Relationships */}
    <SubmissiveRelationshipsDisplay
      relationships={relationships.asKeyholder.map((rel: any) => ({
        ...rel,
        permissions: rel.permissions as unknown as Record<string, boolean>,
      }))}
      onEndRelationship={endRelationship}
    />

    {/* Help Section */}
    <AccountLinkingHelp />
  </div>
);

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

  const handlers = useAccountLinkingHandlers(
    createInviteCode,
    acceptInviteCode,
    validateInviteCode,
    inviteCodeInput,
    keyholderNameInput,
  );

  const linkingState = getAccountLinkingState(
    relationships,
    activeKeyholder,
    activeInviteCodes,
    message,
    messageType,
  );

  if (isLoading) {
    return <AccountLinkingLoading className={className} />;
  }

  return (
    <div className={className}>
      <AccountLinkingContent
        relationships={relationships}
        activeKeyholder={activeKeyholder}
        activeInviteCodes={activeInviteCodes}
        relationshipSummary={relationshipSummary}
        message={message}
        messageType={messageType}
        clearMessage={clearMessage}
        endRelationship={endRelationship}
        linkingState={linkingState}
        isCreatingInvite={isCreatingInvite}
        inviteCodeInput={inviteCodeInput}
        keyholderNameInput={keyholderNameInput}
        isAcceptingInvite={isAcceptingInvite}
        setInviteCodeInput={setInviteCodeInput}
        setKeyholderNameInput={setKeyholderNameInput}
        revokeInviteCode={revokeInviteCode}
        validateInviteCode={validateInviteCode}
        handlers={handlers}
      />
    </div>
  );
};

export default AccountLinking;
