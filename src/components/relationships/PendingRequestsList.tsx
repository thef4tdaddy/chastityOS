import React from "react";
import { Button } from "@/components/ui";
import { FaUsers, FaCheck, FaTimes, FaSpinner } from "../../utils/iconImport";
import type { RelationshipRequest } from "@/types/relationships";

interface PendingRequestsListProps {
  pendingRequests: RelationshipRequest[];
  isLoading: boolean;
  onAccept: (requestId: string) => void;
  onReject: (requestId: string) => void;
}

export const PendingRequestsList: React.FC<PendingRequestsListProps> = ({
  pendingRequests,
  isLoading,
  onAccept,
  onReject,
}) => {
  if (pendingRequests.length === 0) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 relationship-card-enter">
      <h3 className="text-blue-800 font-semibold mb-3 flex items-center">
        <FaUsers className="mr-2" />
        Pending Requests (
        <span className="pending-badge-pulse">{pendingRequests.length}</span>)
      </h3>
      <div className="space-y-3">
        {pendingRequests.map((request, index) => (
          <div
            key={request.id}
            className="bg-white p-3 rounded border relationship-card-enter relationship-transition"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  Relationship Request
                </p>
                <p className="text-sm text-gray-600">
                  From: {request.fromUserId} (as {request.fromRole})
                </p>
                <p className="text-sm text-gray-600">
                  You would be: {request.toRole}
                </p>
                {request.message && (
                  <p className="text-sm text-gray-700 mt-1 italic">
                    "{request.message}"
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => onAccept(request.id)}
                  disabled={isLoading}
                  className="bg-green-600 text-white p-2 rounded hover:bg-green-700 disabled:opacity-50 icon-button"
                  title="Accept"
                >
                  {isLoading ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    <FaCheck />
                  )}
                </Button>
                <Button
                  onClick={() => onReject(request.id)}
                  disabled={isLoading}
                  className="bg-red-600 text-white p-2 rounded hover:bg-red-700 disabled:opacity-50 icon-button"
                  title="Reject"
                >
                  {isLoading ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    <FaTimes />
                  )}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
