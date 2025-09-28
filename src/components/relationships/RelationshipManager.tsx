/**
 * Relationship Manager Component
 * Main interface for managing keyholder relationships
 */
import React, { useState } from "react";
import { useRelationships } from "@/hooks/useRelationships";
import { RelationshipStatus } from "@/types/relationships";
import {
  FaUserPlus,
  FaUsers,
  FaCog,
  FaTrash,
  FaCheck,
  FaTimes,
  FaEye,
  FaSpinner,
  FaExclamationTriangle,
} from "react-icons/fa";

interface RelationshipManagerProps {
  className?: string;
}

const RelationshipManager: React.FC<RelationshipManagerProps> = ({
  className = "",
}) => {
  const {
    relationships,
    pendingRequests,
    activeRelationship,
    isLoading,
    error,
    needsMigration,
    sendRelationshipRequest,
    acceptRelationshipRequest,
    rejectRelationshipRequest,
    endRelationship,
    setActiveRelationship,
    migrateSingleUserData,
    clearError,
  } = useRelationships();

  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestForm, setRequestForm] = useState({
    email: "",
    role: "submissive" as "submissive" | "keyholder",
    message: "",
  });

  // Handle sending relationship request
  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // In a real implementation, you'd need to look up user by email
      // For now, we'll use email as userId (this would need to be implemented)
      await sendRelationshipRequest(
        requestForm.email,
        requestForm.role,
        requestForm.message,
      );
      setShowRequestForm(false);
      setRequestForm({ email: "", role: "submissive", message: "" });
    } catch {
      // Handle error silently or with proper error handling
    }
  };

  // Handle migration
  const handleMigration = async () => {
    try {
      await migrateSingleUserData();
    } catch {
      // Handle migration error silently or with proper error handling
    }
  };

  // Render migration banner
  const renderMigrationBanner = () => {
    if (!needsMigration) return null;

    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <FaExclamationTriangle className="text-yellow-600 mt-1 mr-3" />
          <div className="flex-1">
            <h3 className="text-yellow-800 font-semibold mb-2">
              Data Migration Available
            </h3>
            <p className="text-yellow-700 text-sm mb-3">
              We've detected existing chastity data that can be migrated to the
              new relationship-based system. This will create a self-managed
              profile that you can later share with a keyholder.
            </p>
            <button
              onClick={handleMigration}
              disabled={isLoading}
              className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 disabled:opacity-50 text-sm"
            >
              {isLoading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Migrating...
                </>
              ) : (
                "Migrate My Data"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render pending requests
  const renderPendingRequests = () => {
    if (pendingRequests.length === 0) return null;

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="text-blue-800 font-semibold mb-3 flex items-center">
          <FaUsers className="mr-2" />
          Pending Requests ({pendingRequests.length})
        </h3>
        <div className="space-y-3">
          {pendingRequests.map((request) => (
            <div key={request.id} className="bg-white p-3 rounded border">
              <div className="flex items-center justify-between">
                <div>
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
                  <button
                    onClick={() => acceptRelationshipRequest(request.id)}
                    disabled={isLoading}
                    className="bg-green-600 text-white p-2 rounded hover:bg-green-700 disabled:opacity-50"
                    title="Accept"
                  >
                    <FaCheck />
                  </button>
                  <button
                    onClick={() => rejectRelationshipRequest(request.id)}
                    disabled={isLoading}
                    className="bg-red-600 text-white p-2 rounded hover:bg-red-700 disabled:opacity-50"
                    title="Reject"
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render existing relationships
  const renderRelationships = () => {
    if (relationships.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <FaUsers className="mx-auto text-4xl mb-4 opacity-50" />
          <p>No relationships yet</p>
          <p className="text-sm">
            Send a request to connect with a keyholder or submissive
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {relationships.map((relationship) => (
          <div
            key={relationship.id}
            className={`border rounded-lg p-4 ${
              activeRelationship?.id === relationship.id
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-gray-900">
                    Relationship with{" "}
                    {relationship.submissiveId === relationship.keyholderId
                      ? "Yourself (Self-managed)"
                      : relationship.keyholderId}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      relationship.status === RelationshipStatus.ACTIVE
                        ? "bg-green-100 text-green-800"
                        : relationship.status === RelationshipStatus.PAUSED
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {relationship.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Your role:{" "}
                  {relationship.submissiveId === relationship.keyholderId
                    ? "Both"
                    : relationship.submissiveId === "current-user-id"
                      ? "Submissive"
                      : "Keyholder"}
                </p>
                {relationship.notes && (
                  <p className="text-sm text-gray-700 mt-1 italic">
                    "{relationship.notes}"
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Established:{" "}
                  {relationship.establishedAt.toDate().toLocaleDateString()}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setActiveRelationship(relationship)}
                  className={`p-2 rounded ${
                    activeRelationship?.id === relationship.id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  title="Set as active"
                >
                  <FaEye />
                </button>

                <button
                  className="p-2 rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
                  title="Settings"
                >
                  <FaCog />
                </button>

                <button
                  onClick={() => {
                    // TODO: Replace with proper confirmation modal
                    endRelationship(relationship.id);
                  }}
                  disabled={isLoading}
                  className="p-2 rounded bg-red-100 text-red-600 hover:bg-red-200 disabled:opacity-50"
                  title="End relationship"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render request form
  const renderRequestForm = () => {
    if (!showRequestForm) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4">
            Send Relationship Request
          </h3>

          <form onSubmit={handleSendRequest} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User Email
              </label>
              <input
                type="email"
                value={requestForm.email}
                onChange={(e) =>
                  setRequestForm((prev) => ({ ...prev, email: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="their@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Role
              </label>
              <select
                value={requestForm.role}
                onChange={(e) =>
                  setRequestForm((prev) => ({
                    ...prev,
                    role: e.target.value as "submissive" | "keyholder",
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="submissive">
                  Submissive (they'll be your keyholder)
                </option>
                <option value="keyholder">
                  Keyholder (they'll be your submissive)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message (Optional)
              </label>
              <textarea
                value={requestForm.message}
                onChange={(e) =>
                  setRequestForm((prev) => ({
                    ...prev,
                    message: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Optional message to include with your request..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  "Send Request"
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowRequestForm(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className={`max-w-4xl mx-auto p-6 ${className}`}>
      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <p className="text-red-800">{error}</p>
            <button
              onClick={clearError}
              className="text-red-600 hover:text-red-800"
            >
              <FaTimes />
            </button>
          </div>
        </div>
      )}

      {/* Migration banner */}
      {renderMigrationBanner()}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Relationship Manager
        </h1>

        <button
          onClick={() => setShowRequestForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <FaUserPlus />
          Send Request
        </button>
      </div>

      {/* Active relationship indicator */}
      {activeRelationship && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-800">
            <strong>Active:</strong> Relationship with{" "}
            {activeRelationship.submissiveId === activeRelationship.keyholderId
              ? "Yourself"
              : activeRelationship.keyholderId}
          </p>
        </div>
      )}

      {/* Pending requests */}
      {renderPendingRequests()}

      {/* Relationships list */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Your Relationships ({relationships.length})
        </h2>
        {renderRelationships()}
      </div>

      {/* Request form modal */}
      {renderRequestForm()}

      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg p-4 flex items-center gap-3">
            <FaSpinner className="animate-spin text-blue-600" />
            <span>Processing...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RelationshipManager;
