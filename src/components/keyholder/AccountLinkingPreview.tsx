import React, { useState } from "react";
import { FaUserShield } from "../../utils/iconImport";
import { useAccountLinking } from "../../hooks/account-linking/useAccountLinking";
import {
  ActiveRelationships,
  SubmissivePanel,
  KeyholderPanel,
  QRCodeDisplay,
  type Relationship,
} from "./AccountLinkingComponents";

// Custom hook for account linking handlers
const useAccountLinkingHandlers = (
  generateLinkCode: (params: { shareMethod: string }) => void,
  redeemLinkCode: (params: { code: string }) => void,
  disconnectKeyholder: (id: string, reason: string) => void,
  clearErrors: () => void,
  currentLinkCode: { code: string } | null,
) => {
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkCodeInput, setLinkCodeInput] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  const handleGenerateCode = () => {
    generateLinkCode({ shareMethod: "manual" });
  };

  const handleUseLinkCode = () => {
    if (linkCodeInput.trim()) {
      redeemLinkCode({ code: linkCodeInput.trim() });
      setLinkCodeInput("");
      setShowLinkForm(false);
    }
  };

  const handleCopyCode = async () => {
    if (currentLinkCode?.code) {
      try {
        await navigator.clipboard.writeText(currentLinkCode.code);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch {
        // Silently fail - copying is a nice-to-have feature
      }
    }
  };

  const handleDisconnect = (relationshipId: string) => {
    // TODO: Replace with proper confirmation modal
    disconnectKeyholder(relationshipId, "User requested disconnection");
  };

  const handleCancelLinkForm = () => {
    setShowLinkForm(false);
    setLinkCodeInput("");
    clearErrors();
  };

  return {
    showLinkForm,
    setShowLinkForm,
    linkCodeInput,
    setLinkCodeInput,
    copySuccess,
    handleGenerateCode,
    handleUseLinkCode,
    handleCopyCode,
    handleDisconnect,
    handleCancelLinkForm,
  };
};

// Account Linking Content Component
interface AccountLinkingContentProps {
  hasActiveRelationships: boolean;
  keyholderRelationships: Relationship[];
  wearerRelationships: Relationship[];
  currentLinkCode: { code: string; expiresIn: string } | null;
  isGeneratingCode: boolean;
  linkCodeError: string | null;
  isUsingCode: boolean;
  codeUsageError: string | null;
  showQRCode: boolean;
  toggleQRCode: () => void;
  clearLinkCode: () => void;
  handlers: ReturnType<typeof useAccountLinkingHandlers>;
}

const AccountLinkingContent: React.FC<AccountLinkingContentProps> = ({
  hasActiveRelationships,
  keyholderRelationships,
  wearerRelationships,
  currentLinkCode,
  isGeneratingCode,
  linkCodeError,
  isUsingCode,
  codeUsageError,
  showQRCode,
  toggleQRCode,
  clearLinkCode,
  handlers,
}) => (
  <>
    {/* Current Relationships */}
    {hasActiveRelationships && (
      <ActiveRelationships
        keyholderRelationships={keyholderRelationships}
        wearerRelationships={wearerRelationships}
        onDisconnect={handlers.handleDisconnect}
      />
    )}

    {/* Link Code Generation and Usage */}
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SubmissivePanel
          currentLinkCode={currentLinkCode}
          isGeneratingCode={isGeneratingCode}
          linkCodeError={linkCodeError}
          copySuccess={handlers.copySuccess}
          onGenerateCode={handlers.handleGenerateCode}
          onCopy={handlers.handleCopyCode}
          onToggleQR={toggleQRCode}
          onClear={clearLinkCode}
        />

        <KeyholderPanel
          showLinkForm={handlers.showLinkForm}
          linkCodeInput={handlers.linkCodeInput}
          isUsingCode={isUsingCode}
          codeUsageError={codeUsageError}
          onShowLinkForm={() => handlers.setShowLinkForm(true)}
          onInputChange={handlers.setLinkCodeInput}
          onSubmitCode={handlers.handleUseLinkCode}
          onCancelForm={handlers.handleCancelLinkForm}
        />
      </div>

      {/* QR Code Display */}
      {showQRCode && currentLinkCode && (
        <QRCodeDisplay linkCode={currentLinkCode} />
      )}
    </div>
  </>
);

// Account Linking Component - Now functional!
export const AccountLinkingPreview: React.FC = () => {
  const {
    currentLinkCode,
    linkCodeError,
    isGeneratingCode,
    isUsingCode,
    codeUsageError,
    hasActiveRelationships,
    keyholderRelationships,
    wearerRelationships,
    generateLinkCode,
    redeemLinkCode,
    disconnectKeyholder,
    clearLinkCode,
    clearErrors,
    toggleQRCode,
    showQRCode,
  } = useAccountLinking();

  const handlers = useAccountLinkingHandlers(
    generateLinkCode,
    redeemLinkCode,
    disconnectKeyholder,
    clearErrors,
    currentLinkCode,
  );

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <FaUserShield className="text-nightly-lavender-floral" />
        <h2 className="text-xl font-semibold text-nightly-honeydew">
          Account Linking
        </h2>
        <span className="bg-green-500/20 text-green-400 px-2 py-1 text-xs rounded">
          ACTIVE
        </span>
      </div>

      <AccountLinkingContent
        hasActiveRelationships={hasActiveRelationships}
        keyholderRelationships={keyholderRelationships}
        wearerRelationships={wearerRelationships}
        currentLinkCode={currentLinkCode}
        isGeneratingCode={isGeneratingCode}
        linkCodeError={linkCodeError}
        isUsingCode={isUsingCode}
        codeUsageError={codeUsageError}
        showQRCode={showQRCode}
        toggleQRCode={toggleQRCode}
        clearLinkCode={clearLinkCode}
        handlers={handlers}
      />
    </div>
  );
};
