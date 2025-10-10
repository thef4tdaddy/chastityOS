/**
 * Account Conversion Banner Component
 * Prompts anonymous users to link their account with Google for data backup and sync
 */
import React, { useState } from "react";
import {
  FaGoogle,
  FaTimes,
  FaCheckCircle,
  FaExclamationTriangle,
} from "../../utils/iconImport";
import { useIsAnonymous } from "@/hooks/useIsAnonymous";
import { GoogleSignInButton } from "./GoogleSignInButton";

export const AccountConversionBanner: React.FC = () => {
  const isAnonymous = useIsAnonymous();
  const [dismissed, setDismissed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [linkSuccess, setLinkSuccess] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  // Don't show if:
  // - User is not anonymous
  // - Banner was dismissed
  // - Link was successful
  if (!isAnonymous || dismissed || linkSuccess) {
    return null;
  }

  const handleSuccess = () => {
    setLinkSuccess(true);
    setLinkError(null);
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setDismissed(true);
    }, 5000);
  };

  const handleError = (error: string) => {
    setLinkError(error);
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 p-4 mb-4 rounded-r-lg shadow-sm">
      <div className="flex items-start justify-between gap-4">
        {/* Icon and Content */}
        <div className="flex items-start gap-3 flex-1">
          <div className="flex-shrink-0 mt-1">
            {linkError ? (
              <FaExclamationTriangle className="text-orange-500 text-xl" />
            ) : linkSuccess ? (
              <FaCheckCircle className="text-green-500 text-xl" />
            ) : (
              <FaGoogle className="text-blue-500 text-xl" />
            )}
          </div>

          <div className="flex-1">
            {linkSuccess ? (
              // Success message
              <>
                <h3 className="font-semibold text-green-900 mb-1">
                  Account Linked Successfully! 🎉
                </h3>
                <p className="text-sm text-green-700">
                  Your data is now backed up to your Google account and will
                  sync across all your devices.
                </p>
              </>
            ) : (
              <>
                <h3 className="font-semibold text-blue-900 mb-1">
                  Save Your Progress
                </h3>
                <p className="text-sm text-blue-700 mb-3">
                  You're using a temporary account. Sign in with Google to:
                </p>

                {showDetails && (
                  <ul className="text-sm text-blue-700 mb-3 ml-4 space-y-1">
                    <li>✓ Backup your data to the cloud</li>
                    <li>✓ Sync across multiple devices</li>
                    <li>✓ Never lose your progress</li>
                    <li>✓ Access keyholder features</li>
                  </ul>
                )}

                {!showDetails && (
                  <Button
                    onClick={() => setShowDetails(true)}
                    className="text-sm text-blue-600 hover:text-blue-800 underline mb-2"
                  >
                    Learn more
                  </Button>
                )}

                {linkError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                    <p className="text-sm text-red-700">{linkError}</p>
                  </div>
                )}

                {/* CTA Button */}
                <div className="mt-3 max-w-xs">
                  <GoogleSignInButton
                    mode="link"
                    onSuccess={handleSuccess}
                    onError={handleError}
                    className="shadow-sm"
                  />
                </div>

                <p className="text-xs text-blue-600 mt-2">
                  All your existing data will be preserved
                </p>
              </>
            )}
          </div>
        </div>

        {/* Close button */}
        <Button
          onClick={handleDismiss}
          className="flex-shrink-0 text-blue-400 hover:text-blue-600 transition-colors p-1"
          aria-label="Dismiss"
        >
          <FaTimes />
        </Button>
      </div>
    </div>
  );
};
