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
import { Input, Button } from "@/components/ui";

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
  <div className="bg-white/5 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
    <div className="flex-1 min-w-0">
      <div className="text-sm sm:text-base font-medium text-nightly-honeydew break-words">
        {type === "keyholder"
          ? `Keyholder for: ${relationship.wearerId}`
          : `Managed by: ${relationship.keyholderId}`}
      </div>
      <div className="text-xs sm:text-sm text-nightly-celadon">
        Established: {relationship.establishedAt.toDate().toLocaleDateString()}
      </div>
    </div>
    <Button
      onClick={() => onDisconnect(relationship.id)}
      className="w-full sm:w-auto text-red-400 hover:text-red-300 px-3 py-2 sm:py-1 rounded text-sm min-h-[44px] sm:min-h-0 touch-manipulation flex-shrink-0"
    >
      Disconnect
    </Button>
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
  <div className="mb-4 sm:mb-6">
    <h3 className="text-base sm:text-lg font-medium text-nightly-honeydew mb-3">
      Active Relationships
    </h3>
    <div className="space-y-2 sm:space-y-3">
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
    <div className="bg-black/20 rounded-lg p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <span className="text-nightly-celadon text-xs sm:text-sm">
          Your Link Code:
        </span>
        <span className="text-xs text-nightly-celadon">
          {linkCode.expiresIn}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 mb-3">
        <code className="bg-nightly-aquamarine/20 text-nightly-aquamarine px-3 py-2 rounded font-mono text-sm sm:text-base lg:text-lg flex-1 break-all">
          {linkCode.code}
        </code>
        <Button
          onClick={onCopy}
          className="text-nightly-aquamarine hover:text-nightly-spring-green p-3 sm:p-2 min-h-[44px] sm:min-h-0 touch-manipulation flex items-center justify-center"
          title="Copy to clipboard"
        >
          {copySuccess ? <FaCheck /> : <FaClipboard />}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          onClick={onToggleQR}
          className="bg-white/10 hover:bg-white/20 text-nightly-celadon px-3 py-3 sm:py-2 rounded text-xs sm:text-sm flex items-center justify-center gap-2 min-h-[44px] sm:min-h-0 touch-manipulation"
        >
          <FaQrcode className="flex-shrink-0" />
          <span>QR Code</span>
        </Button>
        <Button
          onClick={onClear}
          className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-3 sm:py-2 rounded text-xs sm:text-sm flex items-center justify-center gap-2 min-h-[44px] sm:min-h-0 touch-manipulation"
        >
          <FaTimes className="flex-shrink-0" />
          <span>Clear</span>
        </Button>
      </div>
    </div>

    <div className="text-xs sm:text-sm text-nightly-celadon">
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
  <div className="bg-white/5 rounded-lg p-3 sm:p-4">
    <h3 className="text-sm sm:text-base font-medium text-nightly-honeydew mb-2 flex items-center gap-2">
      <FaLink className="text-nightly-aquamarine flex-shrink-0" />
      <span>For Submissives</span>
    </h3>
    <ul className="text-xs sm:text-sm text-nightly-celadon space-y-1 mb-4">
      <li>• Generate secure link codes</li>
      <li>• Share privately with keyholder</li>
      <li>• Maintain ultimate control</li>
      <li>• Disconnect anytime</li>
    </ul>

    {!currentLinkCode ? (
      <Button
        onClick={onGenerateCode}
        disabled={isGeneratingCode}
        className="w-full sm:w-auto bg-nightly-aquamarine hover:bg-nightly-aquamarine/80 text-white px-4 py-3 sm:py-2 rounded font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px] sm:min-h-0 touch-manipulation"
      >
        {isGeneratingCode ? (
          <>
            <FaSpinner className="animate-spin flex-shrink-0" />
            <span>Generating...</span>
          </>
        ) : (
          <>
            <FaPlus className="flex-shrink-0" />
            <span>Generate Link Code</span>
          </>
        )}
      </Button>
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
      <div className="bg-red-500/20 text-red-400 p-3 rounded mt-3 flex items-start gap-2 text-xs sm:text-sm">
        <FaExclamationTriangle className="flex-shrink-0 mt-0.5" />
        <span className="break-words">{linkCodeError}</span>
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
    <div className="flex flex-col sm:flex-row gap-2">
      <Input
        type="text"
        value={linkCodeInput}
        onChange={(e) => onInputChange(e.target.value.toUpperCase())}
        placeholder="Enter link code"
        className="flex-1 bg-black/20 text-nightly-honeydew px-3 py-3 sm:py-2 rounded placeholder-nightly-celadon text-sm sm:text-base"
        maxLength={20}
      />
      <Button
        onClick={onSubmit}
        disabled={isUsingCode || !linkCodeInput.trim()}
        className="bg-nightly-lavender-floral hover:bg-nightly-lavender-floral/80 text-white px-4 py-3 sm:py-2 rounded font-medium transition-colors disabled:opacity-50 min-h-[44px] sm:min-h-0 touch-manipulation flex items-center justify-center gap-2"
      >
        {isUsingCode ? (
          <>
            <FaSpinner className="animate-spin flex-shrink-0" />
            <span>Linking...</span>
          </>
        ) : (
          <span>Link</span>
        )}
      </Button>
    </div>
    <Button
      onClick={onCancel}
      className="text-nightly-celadon hover:text-nightly-honeydew text-xs sm:text-sm min-h-[44px] sm:min-h-0 py-2 sm:py-1 px-3 touch-manipulation"
    >
      Cancel
    </Button>

    {codeUsageError && (
      <div className="bg-red-500/20 text-red-400 p-3 rounded flex items-start gap-2 text-xs sm:text-sm">
        <FaExclamationTriangle className="flex-shrink-0 mt-0.5" />
        <span className="break-words">{codeUsageError}</span>
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
  <div className="bg-white/5 rounded-lg p-3 sm:p-4">
    <h3 className="text-sm sm:text-base font-medium text-nightly-honeydew mb-2 flex items-center gap-2">
      <FaUsers className="text-nightly-lavender-floral flex-shrink-0" />
      <span>For Keyholders</span>
    </h3>
    <ul className="text-xs sm:text-sm text-nightly-celadon space-y-1 mb-4">
      <li>• Full admin dashboard access</li>
      <li>• Manage multiple submissives</li>
      <li>• Real-time control & monitoring</li>
      <li>• Audit trail of all actions</li>
    </ul>

    {!showLinkForm ? (
      <Button
        onClick={onShowLinkForm}
        className="w-full sm:w-auto bg-nightly-lavender-floral hover:bg-nightly-lavender-floral/80 text-white px-4 py-3 sm:py-2 rounded font-medium transition-colors flex items-center justify-center gap-2 min-h-[44px] sm:min-h-0 touch-manipulation"
      >
        <FaLink className="flex-shrink-0" />
        <span>Enter Link Code</span>
      </Button>
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
  <div className="bg-white/5 rounded-lg p-3 sm:p-4">
    <h4 className="text-sm sm:text-base font-medium text-nightly-honeydew mb-3">
      QR Code
    </h4>
    <div className="flex items-center justify-center">
      <div className="bg-white p-6 sm:p-8 rounded-lg">
        <div className="text-center text-gray-600 text-xs sm:text-sm">
          QR Code would appear here
          <br />
          (Implementation requires QR library)
        </div>
      </div>
    </div>
  </div>
);
