import React from "react";
import { FaShieldAlt } from "@/utils/iconImport";
import { AdminRelationship } from "@/types/account-linking";
import { Button } from "@/components/ui";

// Admin Session Status Component - memoized for performance
export const AdminSessionStatus = React.memo<{
  selectedRelationship: AdminRelationship;
  isAdminSessionActive: boolean;
  onStartAdminSession: () => void;
}>(({ selectedRelationship, isAdminSessionActive, onStartAdminSession }) => (
  <div
    className="bg-white/5 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6"
    role="region"
    aria-label="Admin session status"
  >
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="w-full sm:w-auto">
        <h3 className="text-sm sm:text-base font-medium text-nightly-honeydew mb-1">
          Admin Session
        </h3>
        <p
          className="text-xs sm:text-sm text-nightly-celadon break-words"
          role="status"
          aria-live="polite"
        >
          {isAdminSessionActive
            ? `Active session for ${selectedRelationship.wearerId}`
            : "No active admin session"}
        </p>
      </div>
      <div className="w-full sm:w-auto">
        {!isAdminSessionActive ? (
          <Button
            onClick={onStartAdminSession}
            aria-label={`Start admin session for ${selectedRelationship.wearerId}`}
            className="w-full sm:w-auto bg-nightly-lavender-floral hover:bg-nightly-lavender-floral/80 text-white px-4 py-3 sm:py-2 rounded font-medium transition-colors flex items-center justify-center gap-2 min-h-[44px] sm:min-h-0 touch-manipulation"
          >
            <FaShieldAlt className="flex-shrink-0" aria-hidden="true" />
            <span>Start Admin Session</span>
          </Button>
        ) : (
          <div className="flex items-center gap-2 text-green-400" role="status">
            <FaShieldAlt className="flex-shrink-0" aria-hidden="true" />
            <span className="text-xs sm:text-sm">Session Active</span>
          </div>
        )}
      </div>
    </div>
  </div>
));
AdminSessionStatus.displayName = "AdminSessionStatus";
