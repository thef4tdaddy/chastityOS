/**
 * Demo component for Account Linking UI
 * Shows the interface with mock data for demonstration
 */

import React from "react";
import { useAccountLinkingDemo } from "../../demo/hooks/useAccountLinkingDemo";
import {
  MessageDisplay,
  ActiveKeyholder,
  CreateInviteSection,
  ActiveInviteCodes,
  AcceptInviteSection,
  SubmissiveRelationships,
  HelpSection,
} from "./AccountLinkingDemoComponents";

type DemoScenario =
  | "submissive-no-keyholder"
  | "submissive-with-keyholder"
  | "keyholder-mode";

interface AccountLinkingDemoProps {
  className?: string;
  scenario?: DemoScenario;
}

export const AccountLinkingDemo: React.FC<AccountLinkingDemoProps> = ({
  className = "",
  scenario = "submissive-no-keyholder",
}) => {
  const actualScenario: DemoScenario = (scenario || "submissive-no-keyholder") as DemoScenario;
  const {
    // UI State
    showCreateInvite,
    setShowCreateInvite,
    showAcceptInvite,
    setShowAcceptInvite,
    showPermissions,
    setShowPermissions,
    inviteCodeInput,
    setInviteCodeInput,
    keyholderNameInput,
    setKeyholderNameInput,
    message,
    messageType,

    // Actions
    clearMessage,
    handleCreateInvite,
    handleAcceptInvite,
    copyToClipboard,

    // Mock Data
    activeKeyholder,
    activeInviteCodes,
    relationships,
  } = useAccountLinkingDemo(actualScenario);

  const hasActiveKeyholder = !!activeKeyholder;

  return (
    <div className={`space-y-4 ${className}`}>
      <MessageDisplay
        message={message}
        messageType={messageType}
        clearMessage={clearMessage}
      />

      {hasActiveKeyholder && (
        <ActiveKeyholder
          activeKeyholder={activeKeyholder}
          showPermissions={showPermissions}
          setShowPermissions={setShowPermissions}
        />
      )}

      <CreateInviteSection
        hasActiveKeyholder={hasActiveKeyholder}
        showCreateInvite={showCreateInvite}
        setShowCreateInvite={setShowCreateInvite}
        handleCreateInvite={handleCreateInvite}
      />

      <ActiveInviteCodes
        activeInviteCodes={activeInviteCodes}
        copyToClipboard={copyToClipboard}
      />

      <AcceptInviteSection
        showAcceptInvite={showAcceptInvite}
        setShowAcceptInvite={setShowAcceptInvite}
        inviteCodeInput={inviteCodeInput}
        setInviteCodeInput={setInviteCodeInput}
        keyholderNameInput={keyholderNameInput}
        setKeyholderNameInput={setKeyholderNameInput}
        handleAcceptInvite={handleAcceptInvite}
      />

      <SubmissiveRelationships relationships={relationships} />

      <HelpSection />
    </div>
  );
};

export default AccountLinkingDemo;
