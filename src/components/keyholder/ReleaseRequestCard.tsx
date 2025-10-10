import React, { useState, memo, useMemo, useCallback } from "react";
import {
  FaPrayingHands,
  FaCheck,
  FaTimes,
  FaClock,
  FaSpinner,
} from "react-icons/fa";
import type { DBReleaseRequest } from "../../types/database";
import { useReleaseRequestMutations } from "../../hooks/api/useReleaseRequests";
import { useToast } from "../../contexts";
import { Modal, Textarea } from "@/components/ui";

interface ReleaseRequestCardProps {
  request: DBReleaseRequest;
}

interface ResponseModalProps {
  isOpen: boolean;
  responseType: "approve" | "deny";
  responseMessage: string;
  isProcessing: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onMessageChange: (message: string) => void;
}

// Extracted modal component for approve/deny release request responses
const ResponseModalComponent: React.FC<ResponseModalProps> = ({
  isOpen,
  responseType,
  responseMessage,
  isProcessing,
  onClose,
  onSubmit,
  onMessageChange,
}) => {
  const isApprove = responseType === "approve";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isApprove ? "Approve Release Request" : "Deny Release Request"}
      icon={
        isApprove ? (
          <FaCheck className="text-4xl text-green-400" />
        ) : (
          <FaTimes className="text-4xl text-red-400" />
        )
      }
      size="sm"
      closeOnEscape={!isProcessing}
      className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-purple-500"
      footer={
        <div className="flex flex-col space-y-3">
          <button
            onClick={onSubmit}
            disabled={isProcessing}
            className={`w-full font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2 ${
              isApprove
                ? "bg-green-600 hover:bg-green-700 disabled:bg-gray-600"
                : "bg-red-600 hover:bg-red-700 disabled:bg-gray-600"
            } disabled:cursor-not-allowed text-white`}
          >
            {isProcessing ? (
              <>
                <FaSpinner className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {isApprove ? (
                  <>
                    <FaCheck />
                    Approve Request
                  </>
                ) : (
                  <>
                    <FaTimes />
                    Deny Request
                  </>
                )}
              </>
            )}
          </button>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="w-full bg-gray-600 hover:bg-gray-500 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition"
          >
            Cancel
          </button>
        </div>
      }
    >
      <div>
        <div
          className={`border rounded-lg p-4 mb-6 ${
            isApprove
              ? "bg-green-900/30 border-green-600"
              : "bg-red-900/30 border-red-600"
          }`}
        >
          <p className="text-sm text-gray-200">
            {isApprove
              ? "The submissive will be able to end their session immediately."
              : "The submissive will not be able to end their session early."}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Message to Submissive (optional):
          </label>
          <Textarea
            value={responseMessage}
            onChange={(e) => onMessageChange(e.target.value)}
            placeholder={
              isApprove
                ? "You may end your session. Good job!"
                : "Not yet. Keep going!"
            }
            rows={3}
            maxLength={500}
            className="w-full p-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none"
          />
          <div className="text-xs text-gray-400 mt-1">
            {responseMessage.length}/500 characters
          </div>
        </div>
      </div>
    </Modal>
  );
};

// Memoize ResponseModal to prevent unnecessary re-renders
const ResponseModal = memo(ResponseModalComponent);

const ReleaseRequestCardComponent: React.FC<ReleaseRequestCardProps> = ({
  request,
}) => {
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseType, setResponseType] = useState<"approve" | "deny">(
    "approve",
  );
  const [responseMessage, setResponseMessage] = useState("");

  const { approveRequest, denyRequest } = useReleaseRequestMutations();
  const { showSuccess, showError } = useToast();

  const isProcessing = approveRequest.isPending || denyRequest.isPending;

  const handleOpenResponse = useCallback((type: "approve" | "deny") => {
    setResponseType(type);
    setShowResponseModal(true);
  }, []);

  const handleSubmitResponse = useCallback(async () => {
    try {
      if (responseType === "approve") {
        await approveRequest.mutateAsync({
          requestId: request.id,
          response: responseMessage.trim() || undefined,
        });
        showSuccess("Release request approved");
      } else {
        await denyRequest.mutateAsync({
          requestId: request.id,
          response: responseMessage.trim() || undefined,
        });
        showSuccess("Release request denied");
      }

      setShowResponseModal(false);
      setResponseMessage("");
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : `Failed to ${responseType} request`,
      );
    }
  }, [
    responseType,
    request.id,
    responseMessage,
    approveRequest,
    denyRequest,
    showSuccess,
    showError,
  ]);

  // Memoize formatTimeAgo result
  const timeAgo = useMemo(() => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(request.requestedAt).getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }, [request.requestedAt]);

  // Memoize session ID slice
  const sessionIdShort = useMemo(
    () => request.sessionId.slice(-8),
    [request.sessionId],
  );

  return (
    <>
      <div className="bg-white/5 border border-purple-500/50 rounded-lg p-4 hover:bg-white/10 transition-colors">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <FaPrayingHands className="text-purple-400 text-xl" />
            <div>
              <h4 className="font-semibold text-nightly-honeydew">
                Release Request
              </h4>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <FaClock className="text-xs" />
                <span>{timeAgo}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenResponse("approve")}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded transition-colors"
              title="Approve request"
            >
              <FaCheck />
            </button>
            <button
              onClick={() => handleOpenResponse("deny")}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded transition-colors"
              title="Deny request"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {request.reason && (
          <div className="bg-purple-900/30 border border-purple-600/50 rounded p-3 mt-3">
            <p className="text-sm font-medium text-purple-300 mb-1">Reason:</p>
            <p className="text-sm text-purple-200">{request.reason}</p>
          </div>
        )}

        <div className="mt-3 text-xs text-gray-500">
          Session: {sessionIdShort}
        </div>
      </div>

      <ResponseModal
        isOpen={showResponseModal}
        responseType={responseType}
        responseMessage={responseMessage}
        isProcessing={isProcessing}
        onClose={() => setShowResponseModal(false)}
        onSubmit={handleSubmitResponse}
        onMessageChange={setResponseMessage}
      />
    </>
  );
};

// Memoize ReleaseRequestCard to prevent unnecessary re-renders
export const ReleaseRequestCard = memo(ReleaseRequestCardComponent);
