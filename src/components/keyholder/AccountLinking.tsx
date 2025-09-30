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
import { KeyholderRelationship } from "../../types/core";
import type { KeyholderRelationshipState } from "../../hooks/useKeyholderRelationships";

interface AccountLinkingProps {
  className?: string;
}

// Local type definition to avoid restricted service import
type InviteCode = {
  id: string;
  code: string;
  submissiveUserId: string;
  submissiveName?: string;
  createdAt: Date;
  expiresAt: Date;
  usedAt?: Date;
  usedByKeyholderId?: string;
  status: "active" | "used" | "expired" | "revoked";
};

// Helper functions to reduce complexity
const useAccountLinkingHandlers = (
  createInviteCode: (hours: number) => Promise<InviteCode | null>,
  acceptInviteCode: (code: string, name: string) => Promise<boolean>,
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

// Header and Messages Section
const HeaderAndMessages: React.FC<{
  message: string;
  messageType: "success" | "error" | "info";
  clearMessage: () => void;
  relationshipSummary: KeyholderRelationshipState["relationshipSummary"];
}> = ({ message, messageType, clearMessage, relationshipSummary }) => (
  <>
    <AccountLinkingHeader />
    <LinkingMessageDisplay
      message={message}
      messageType={messageType}
      onClearMessage={clearMessage}
    />
    <RelationshipSummary relationshipSummary={relationshipSummary} />
  </>
);

// Invite Code Sections
const InviteCodeSections: React.FC<{
  activeInviteCodes: InviteCode[];
  inviteCodeInput: string;
  keyholderNameInput: string;
  isCreatingInvite: boolean;
  isAcceptingInvite: boolean;
  linkingState: ReturnType<typeof getAccountLinkingState>;
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
  activeInviteCodes,
  inviteCodeInput,
  keyholderNameInput,
  isCreatingInvite,
  isAcceptingInvite,
  linkingState,
  setInviteCodeInput,
  setKeyholderNameInput,
  revokeInviteCode,
  validateInviteCode,
  handlers,
}) => (
  <>
    <InviteCodeCreationSection
      shouldShow={!linkingState.hasActiveKeyholder}
      isCreatingInvite={isCreatingInvite}
      onCreateInvite={handlers.handleCreateInvite}
    />
    <ActiveInviteCodesDisplay
      activeInviteCodes={activeInviteCodes}
      onCopyCode={handlers.copyToClipboard}
      onRevokeCode={revokeInviteCode}
    />
    <AcceptInviteCodeSection
      inviteCodeInput={inviteCodeInput}
      keyholderNameInput={keyholderNameInput}
      isAcceptingInvite={isAcceptingInvite}
      onSetInviteCodeInput={setInviteCodeInput}
      onSetKeyholderNameInput={setKeyholderNameInput}
      onAcceptInvite={handlers.handleAcceptInvite}
      validateInviteCode={validateInviteCode}
    />
  </>
);

// Main Component Content
const AccountLinkingContent: React.FC<{
  relationships: KeyholderRelationshipState["relationships"];
  activeKeyholder: KeyholderRelationship | null;
  activeInviteCodes: InviteCode[];
  relationshipSummary: KeyholderRelationshipState["relationshipSummary"];
  message: string;
  messageType: "success" | "error" | "info";
  clearMessage: () => void;
  endRelationship: (id: string) => void;
  linkingState: ReturnType<typeof getAccountLinkingState>;
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
    <HeaderAndMessages
      message={message}
      messageType={messageType}
      clearMessage={clearMessage}
      relationshipSummary={relationshipSummary}
    />

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

    <InviteCodeSections
      activeInviteCodes={activeInviteCodes}
      inviteCodeInput={inviteCodeInput}
      keyholderNameInput={keyholderNameInput}
      isCreatingInvite={isCreatingInvite}
      isAcceptingInvite={isAcceptingInvite}
      linkingState={linkingState}
      setInviteCodeInput={setInviteCodeInput}
      setKeyholderNameInput={setKeyholderNameInput}
      revokeInviteCode={revokeInviteCode}
      validateInviteCode={validateInviteCode}
      handlers={handlers}
    />

    <SubmissiveRelationshipsDisplay
      relationships={relationships.asKeyholder.map((rel) => ({
        ...rel,
        permissions: rel.permissions as unknown as Record<string, boolean>,
      }))}
      onEndRelationship={endRelationship}
    />

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
