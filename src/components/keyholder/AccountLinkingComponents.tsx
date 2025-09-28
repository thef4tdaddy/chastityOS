import React from "react";
import {
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

// Interface for relationship data
export interface Relationship {
  id: string;
  wearerId?: string;
  keyholderId?: string;
  establishedAt: { toDate: () => Date };
}

// Relationship Card Component
interface RelationshipCardProps {
  relationship: Relationship;
  type: "keyholder" | "wearer";
  onDisconnect: (relationshipId: string) => void;
}

export const RelationshipCard: React.FC<RelationshipCardProps> = ({
  relationship,
  type,
  onDisconnect,
}) => (
  <div className="bg-white/5 rounded-lg p-4 flex items-center justify-between">
    <div>
      <div className="font-medium text-nightly-honeydew">
        {type === "keyholder"
          ? `Keyholder for: ${relationship.wearerId}`
          : `Managed by: ${relationship.keyholderId}`}
      </div>
      <div className="text-sm text-nightly-celadon">
        Established: {relationship.establishedAt.toDate().toLocaleDateString()}
      </div>
    </div>
    <button
      onClick={() => onDisconnect(relationship.id)}
      className="text-red-400 hover:text-red-300 px-3 py-1 rounded text-sm"
    >
      Disconnect
    </button>
  </div>
);

// Active Relationships Component
interface ActiveRelationshipsProps {
  keyholderRelationships: Relationship[];
  wearerRelationships: Relationship[];
  onDisconnect: (relationshipId: string) => void;
}

export const ActiveRelationships: React.FC<ActiveRelationshipsProps> = ({
  keyholderRelationships,
  wearerRelationships,
  onDisconnect,
}) => (
  <div className="mb-6">
    <h3 className="text-lg font-medium text-nightly-honeydew mb-3">
      Active Relationships
    </h3>
    <div className="space-y-3">
      {keyholderRelationships.map((relationship) => (
        <RelationshipCard
          key={relationship.id}
          relationship={relationship}
          type="keyholder"
          onDisconnect={onDisconnect}
        />
      ))}
      {wearerRelationships.map((relationship) => (
        <RelationshipCard
          key={relationship.id}
          relationship={relationship}
          type="wearer"
          onDisconnect={onDisconnect}
        />
      ))}
    </div>
  </div>
);

// Link Code Display Component
interface LinkCodeDisplayProps {
  linkCode: {
    code: string;
    expiresIn: string;
  };
  copySuccess: boolean;
  onCopy: () => void;
  onToggleQR: () => void;
  onClear: () => void;
}

export const LinkCodeDisplay: React.FC<LinkCodeDisplayProps> = ({
  linkCode,
  copySuccess,
  onCopy,
  onToggleQR,
  onClear,
}) => (
  <div className="space-y-3">
    <div className="bg-black/20 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-nightly-celadon text-sm">Your Link Code:</span>
        <span className="text-xs text-nightly-celadon">
          {linkCode.expiresIn}
        </span>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <code className="bg-nightly-aquamarine/20 text-nightly-aquamarine px-3 py-2 rounded font-mono text-lg flex-1">
          {linkCode.code}
        </code>
        <button
          onClick={onCopy}
          className="text-nightly-aquamarine hover:text-nightly-spring-green p-2"
          title="Copy to clipboard"
        >
          {copySuccess ? <FaCheck /> : <FaClipboard />}
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onToggleQR}
          className="bg-white/10 hover:bg-white/20 text-nightly-celadon px-3 py-1 rounded text-sm flex items-center gap-2"
        >
          <FaQrcode />
          QR Code
        </button>
        <button
          onClick={onClear}
          className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-1 rounded text-sm flex items-center gap-2"
        >
          <FaTimes />
          Clear
        </button>
      </div>
    </div>

    <div className="text-sm text-nightly-celadon">
      <p className="mb-2">
        <strong>Secure Sharing:</strong> Share this code privately with your
        keyholder via text, voice, QR code, or secure message.
      </p>
      <p>
        <strong>One-Time Use:</strong> Code expires in 24 hours or after first
        use. You can disconnect the keyholder anytime.
      </p>
    </div>
  </div>
);

// Submissive Panel Component
interface SubmissivePanelProps {
  currentLinkCode: { code: string; expiresIn: string } | null;
  isGeneratingCode: boolean;
  linkCodeError: string | null;
  copySuccess: boolean;
  onGenerateCode: () => void;
  onCopy: () => void;
  onToggleQR: () => void;
  onClear: () => void;
}

export const SubmissivePanel: React.FC<SubmissivePanelProps> = ({
  currentLinkCode,
  isGeneratingCode,
  linkCodeError,
  copySuccess,
  onGenerateCode,
  onCopy,
  onToggleQR,
  onClear,
}) => (
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
        onClick={onGenerateCode}
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
      <LinkCodeDisplay
        linkCode={currentLinkCode}
        copySuccess={copySuccess}
        onCopy={onCopy}
        onToggleQR={onToggleQR}
        onClear={onClear}
      />
    )}

    {linkCodeError && (
      <div className="bg-red-500/20 text-red-400 p-3 rounded mt-3 flex items-center gap-2">
        <FaExclamationTriangle />
        {linkCodeError}
      </div>
    )}
  </div>
);

// Link Code Input Form Component
interface LinkCodeInputFormProps {
  linkCodeInput: string;
  isUsingCode: boolean;
  codeUsageError: string | null;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export const LinkCodeInputForm: React.FC<LinkCodeInputFormProps> = ({
  linkCodeInput,
  isUsingCode,
  codeUsageError,
  onInputChange,
  onSubmit,
  onCancel,
}) => (
  <div className="space-y-3">
    <div className="flex gap-2">
      <input
        type="text"
        value={linkCodeInput}
        onChange={(e) => onInputChange(e.target.value.toUpperCase())}
        placeholder="Enter link code"
        className="flex-1 bg-black/20 text-nightly-honeydew px-3 py-2 rounded placeholder-nightly-celadon"
        maxLength={20}
      />
      <button
        onClick={onSubmit}
        disabled={isUsingCode || !linkCodeInput.trim()}
        className="bg-nightly-lavender-floral hover:bg-nightly-lavender-floral/80 text-white px-4 py-2 rounded font-medium transition-colors disabled:opacity-50"
      >
        {isUsingCode ? <FaSpinner className="animate-spin" /> : "Link"}
      </button>
    </div>
    <button
      onClick={onCancel}
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
);

// Keyholder Panel Component
interface KeyholderPanelProps {
  showLinkForm: boolean;
  linkCodeInput: string;
  isUsingCode: boolean;
  codeUsageError: string | null;
  onShowLinkForm: () => void;
  onInputChange: (value: string) => void;
  onSubmitCode: () => void;
  onCancelForm: () => void;
}

export const KeyholderPanel: React.FC<KeyholderPanelProps> = ({
  showLinkForm,
  linkCodeInput,
  isUsingCode,
  codeUsageError,
  onShowLinkForm,
  onInputChange,
  onSubmitCode,
  onCancelForm,
}) => (
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
        onClick={onShowLinkForm}
        className="bg-nightly-lavender-floral hover:bg-nightly-lavender-floral/80 text-white px-4 py-2 rounded font-medium transition-colors flex items-center gap-2"
      >
        <FaLink />
        Enter Link Code
      </button>
    ) : (
      <LinkCodeInputForm
        linkCodeInput={linkCodeInput}
        isUsingCode={isUsingCode}
        codeUsageError={codeUsageError}
        onInputChange={onInputChange}
        onSubmit={onSubmitCode}
        onCancel={onCancelForm}
      />
    )}
  </div>
);

// QR Code Display Component
interface QRCodeDisplayProps {
  linkCode: { code: string };
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  linkCode: _linkCode,
}) => (
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
);
