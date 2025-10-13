import React from "react";
import { FaPrayingHands, FaSpinner } from "@/utils/iconImport";
import { usePendingReleaseRequests } from "@/hooks/api/useReleaseRequests";
import { FeatureErrorBoundary } from "@/components/errors/FeatureErrorBoundary";
import { ReleaseRequestCard } from "@/components/keyholder/ReleaseRequestCard";

// Pending Release Requests Component - memoized for performance
export const PendingReleaseRequests = React.memo<{ keyholderUserId: string }>(
  ({ keyholderUserId }) => {
    const { data: pendingRequests, isLoading } =
      usePendingReleaseRequests(keyholderUserId);

    if (isLoading) {
      return (
        <div className="bg-white/5 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 text-nightly-celadon text-sm sm:text-base">
            <FaSpinner className="animate-spin flex-shrink-0" />
            <span>Loading requests...</span>
          </div>
        </div>
      );
    }

    if (!pendingRequests || pendingRequests.length === 0) {
      return null;
    }

    return (
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center gap-2 mb-3">
          <FaPrayingHands className="text-purple-400 flex-shrink-0" />
          <h3 className="text-sm sm:text-base font-semibold text-nightly-honeydew">
            Pending Release Requests ({pendingRequests.length})
          </h3>
        </div>
        <div className="space-y-2 sm:space-y-3">
          {pendingRequests.map((request) => (
            <FeatureErrorBoundary key={request.id} feature="release-request">
              <ReleaseRequestCard request={request} />
            </FeatureErrorBoundary>
          ))}
        </div>
      </div>
    );
  },
);
PendingReleaseRequests.displayName = "PendingReleaseRequests";
