/**
 * Google Authentication Privacy Notice
 * Informs users about Google authentication requirements for account linking
 */
import React from "react";

interface GoogleAuthNoticeProps {
  className?: string;
}

export const GoogleAuthNotice: React.FC<GoogleAuthNoticeProps> = ({
  className = "",
}) => {
  return (
    <div
      className={`rounded-lg border border-blue-200 bg-blue-50 p-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-blue-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-blue-800">
            Google Sign-In Required
          </h3>
          <div className="mt-2 text-sm text-blue-700">
            <p className="mb-2">
              To link your account with a keyholder or submissive,{" "}
              <span className="font-semibold">
                both users must be signed in with Google
              </span>
              .
            </p>
            <p className="mb-2 font-medium">Why Google authentication?</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <span className="font-semibold">
                  Prevents losing access to your relationship
                </span>{" "}
                - Google accounts provide permanent, recoverable access
              </li>
              <li>Enhanced security for relationship management</li>
              <li>Reliable identity verification between partners</li>
              <li>Protection against unauthorized account linking</li>
              <li>Secure data synchronization across all your devices</li>
            </ul>
            <p className="mt-3 text-xs text-blue-600">
              Your privacy is important. We only access your basic profile
              information (name and email) for authentication purposes. Google
              sign-in ensures you'll never lose access to your linked accounts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
