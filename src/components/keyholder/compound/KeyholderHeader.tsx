/**
 * KeyholderHeader - Sub-component for keyholder dashboard header
 */

import React from "react";
import { useKeyholderContext } from "./KeyholderContext";
import { FaUserShield } from "../../../utils/iconImport";
import { usePendingReleaseRequests } from "../../../hooks/api/useReleaseRequests";
import { ReleaseRequestCard } from "../ReleaseRequestCard";

export const KeyholderHeader: React.FC = () => {
  const { keyholderUserId, keyholderRelationships } = useKeyholderContext();

  const { data: pendingRequests, isLoading } = usePendingReleaseRequests(
    keyholderUserId || "",
  );

  return (
    <div className="space-y-4">
      {/* Dashboard Title */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <FaUserShield className="text-2xl text-nightly-aquamarine" />
          <h1 className="text-2xl font-bold text-nightly-honeydew">
            Keyholder Dashboard
          </h1>
        </div>
        <p className="text-nightly-celadon">
          Managing {keyholderRelationships.length} wearer
          {keyholderRelationships.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Pending Release Requests */}
      {!isLoading &&
        pendingRequests &&
        pendingRequests.length > 0 &&
        keyholderUserId && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-nightly-honeydew">
              Pending Release Requests
            </h3>
            {pendingRequests.map((request) => (
              <ReleaseRequestCard
                key={request.id}
                request={request}
                keyholderUserId={keyholderUserId}
              />
            ))}
          </div>
        )}
    </div>
  );
};
