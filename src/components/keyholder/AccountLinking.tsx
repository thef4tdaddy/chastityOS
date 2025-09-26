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

  // Helper functions to reduce complexity
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
    <div className={`space-y-6 ${className}`}>
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
          activeKeyholder={activeKeyholder}
          onEndRelationship={endRelationship}
        />
      )}

      {/* Create Invite Code Section */}
      <InviteCodeCreationSection
        shouldShow={!linkingState.hasActiveKeyholder}
        isCreatingInvite={isCreatingInvite}
        onCreateInvite={handleCreateInvite}
      />

      {/* Active Invite Codes */}
      <ActiveInviteCodesDisplay
        activeInviteCodes={activeInviteCodes}
        onCopyCode={copyToClipboard}
        onRevokeCode={revokeInviteCode}
      />

      {/* Accept Invite Code Section */}
      <AcceptInviteCodeSection
        inviteCodeInput={inviteCodeInput}
        keyholderNameInput={keyholderNameInput}
        isAcceptingInvite={isAcceptingInvite}
        onSetInviteCodeInput={setInviteCodeInput}
        onSetKeyholderNameInput={setKeyholderNameInput}
        onAcceptInvite={handleAcceptInvite}
        validateInviteCode={validateInviteCode}
      />

      {/* Submissive Relationships */}
      <SubmissiveRelationshipsDisplay
        relationships={relationships.asKeyholder}
        onEndRelationship={endRelationship}
      />

      {/* Help Section */}
      <AccountLinkingHelp />
    </div>
  );
};

export default AccountLinking;
