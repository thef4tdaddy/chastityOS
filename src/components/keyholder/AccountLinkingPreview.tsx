import React, { useState } from "react";
import {
  FaUserShield,
  FaLink,
  FaUsers,
  FaQrcode,
  FaClipboard,
  FaPlus,
  FaSpinner,
  FaExclamationTriangle,
  FaTimes,
  FaCheck,
} from "../../utils/iconImport";
import { useAccountLinking } from "../../hooks/account-linking/useAccountLinking";
import { useAuthState } from "../../contexts";

// Account Linking Component - Now functional!
export const AccountLinkingPreview: React.FC = () => {
  const { user } = useAuthState();
  const {
    currentLinkCode,
    linkCodeError,
    isGeneratingCode,
    isUsingCode,
    codeUsageError,
    relationships,
    isKeyholder,
    isWearer,
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
      } catch (error) {
        // Silently fail - copying is a nice-to-have feature
      }
    }
  };

  const handleDisconnect = (relationshipId: string) => {
    // TODO: Replace with proper confirmation modal
    disconnectKeyholder(relationshipId, "User requested disconnection");
  };

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

      {/* Current Relationships */}
      {hasActiveRelationships && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-nightly-honeydew mb-3">
            Active Relationships
          </h3>
          <div className="space-y-3">
            {keyholderRelationships.map((relationship) => (
              <div
                key={relationship.id}
                className="bg-white/5 rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <div className="font-medium text-nightly-honeydew">
                    Keyholder for: {relationship.wearerId}
                  </div>
                  <div className="text-sm text-nightly-celadon">
                    Established:{" "}
                    {relationship.establishedAt.toDate().toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => handleDisconnect(relationship.id)}
                  className="text-red-400 hover:text-red-300 px-3 py-1 rounded text-sm"
                >
                  Disconnect
                </button>
              </div>
            ))}
            {wearerRelationships.map((relationship) => (
              <div
                key={relationship.id}
                className="bg-white/5 rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <div className="font-medium text-nightly-honeydew">
                    Managed by: {relationship.keyholderId}
                  </div>
                  <div className="text-sm text-nightly-celadon">
                    Established:{" "}
                    {relationship.establishedAt.toDate().toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => handleDisconnect(relationship.id)}
                  className="text-red-400 hover:text-red-300 px-3 py-1 rounded text-sm"
                >
                  Disconnect
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Link Code Generation (For Wearers) */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="font-medium text-nightly-honeydew mb-2 flex items-center gap-2">
              <FaLink className="text-nightly-aquamarine" />
              For Submissives
            </h3>
            <ul className="text-sm text-nightly-celadon space-y-1 mb-4">
              <li>• Generate secure link codes</li>
              <li>• Share privately with keyholder</li>
              <li>• Maintain ultimate control</li>
              <li>• Disconnect anytime</li>
            </ul>

            {!currentLinkCode ? (
              <button
                onClick={handleGenerateCode}
                disabled={isGeneratingCode}
                className="bg-nightly-aquamarine hover:bg-nightly-aquamarine/80 text-white px-4 py-2 rounded font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isGeneratingCode ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FaPlus />
                    Generate Link Code
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-3">
                <div className="bg-black/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-nightly-celadon text-sm">
                      Your Link Code:
                    </span>
                    <span className="text-xs text-nightly-celadon">
                      {currentLinkCode.expiresIn}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <code className="bg-nightly-aquamarine/20 text-nightly-aquamarine px-3 py-2 rounded font-mono text-lg flex-1">
                      {currentLinkCode.code}
                    </code>
                    <button
                      onClick={handleCopyCode}
                      className="text-nightly-aquamarine hover:text-nightly-spring-green p-2"
                      title="Copy to clipboard"
                    >
                      {copySuccess ? <FaCheck /> : <FaClipboard />}
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={toggleQRCode}
                      className="bg-white/10 hover:bg-white/20 text-nightly-celadon px-3 py-1 rounded text-sm flex items-center gap-2"
                    >
                      <FaQrcode />
                      QR Code
                    </button>
                    <button
                      onClick={clearLinkCode}
                      className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-1 rounded text-sm flex items-center gap-2"
                    >
                      <FaTimes />
                      Clear
                    </button>
                  </div>
                </div>

                <div className="text-sm text-nightly-celadon">
                  <p className="mb-2">
                    <strong>Secure Sharing:</strong> Share this code privately
                    with your keyholder via text, voice, QR code, or secure
                    message.
                  </p>
                  <p>
                    <strong>One-Time Use:</strong> Code expires in 24 hours or
                    after first use. You can disconnect the keyholder anytime.
                  </p>
                </div>
              </div>
            )}

            {linkCodeError && (
              <div className="bg-red-500/20 text-red-400 p-3 rounded mt-3 flex items-center gap-2">
                <FaExclamationTriangle />
                {linkCodeError}
              </div>
            )}
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="font-medium text-nightly-honeydew mb-2 flex items-center gap-2">
              <FaUsers className="text-nightly-lavender-floral" />
              For Keyholders
            </h3>
            <ul className="text-sm text-nightly-celadon space-y-1 mb-4">
              <li>• Full admin dashboard access</li>
              <li>• Manage multiple submissives</li>
              <li>• Real-time control & monitoring</li>
              <li>• Audit trail of all actions</li>
            </ul>

            {!showLinkForm ? (
              <button
                onClick={() => setShowLinkForm(true)}
                className="bg-nightly-lavender-floral hover:bg-nightly-lavender-floral/80 text-white px-4 py-2 rounded font-medium transition-colors flex items-center gap-2"
              >
                <FaLink />
                Enter Link Code
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={linkCodeInput}
                    onChange={(e) =>
                      setLinkCodeInput(e.target.value.toUpperCase())
                    }
                    placeholder="Enter link code"
                    className="flex-1 bg-black/20 text-nightly-honeydew px-3 py-2 rounded placeholder-nightly-celadon"
                    maxLength={20}
                  />
                  <button
                    onClick={handleUseLinkCode}
                    disabled={isUsingCode || !linkCodeInput.trim()}
                    className="bg-nightly-lavender-floral hover:bg-nightly-lavender-floral/80 text-white px-4 py-2 rounded font-medium transition-colors disabled:opacity-50"
                  >
                    {isUsingCode ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      "Link"
                    )}
                  </button>
                </div>
                <button
                  onClick={() => {
                    setShowLinkForm(false);
                    setLinkCodeInput("");
                    clearErrors();
                  }}
                  className="text-nightly-celadon hover:text-nightly-honeydew text-sm"
                >
                  Cancel
                </button>

                {codeUsageError && (
                  <div className="bg-red-500/20 text-red-400 p-3 rounded flex items-center gap-2">
                    <FaExclamationTriangle />
                    {codeUsageError}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* QR Code Display */}
        {showQRCode && currentLinkCode && (
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-medium text-nightly-honeydew mb-3">QR Code</h4>
            <div className="flex items-center justify-center">
              <div className="bg-white p-4 rounded-lg">
                <div className="text-center text-gray-600">
                  QR Code would appear here
                  <br />
                  (Implementation requires QR library)
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
