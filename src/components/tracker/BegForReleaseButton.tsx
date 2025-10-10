import React, { useState } from "react";
import { FaPrayingHands, FaSpinner, FaTimes } from "react-icons/fa";
import {
  useReleaseRequestMutations,
  usePendingRequestForSession,
} from "../../hooks/api/useReleaseRequests";
import { useToast } from "../../contexts";
import { Textarea } from "@/components/ui";

// Request Modal Component
interface RequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  reason: string;
  setReason: (reason: string) => void;
  isSubmitting: boolean;
}

const RequestModal: React.FC<RequestModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  reason,
  setReason,
  isSubmitting,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 max-w-md w-full rounded-xl border-2 border-purple-500 shadow-2xl">
        <div className="relative p-6">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors disabled:cursor-not-allowed"
          >
            <FaTimes size={20} />
          </button>

          <div className="text-center mb-6">
            <FaPrayingHands className="text-6xl text-purple-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-purple-300">
              Request Early Release
            </h3>
          </div>

          <div className="bg-purple-900/30 border border-purple-600 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-purple-300 mb-2">
              ℹ️ About Release Requests
            </h4>
            <p className="text-sm text-purple-200">
              This sends a request to your keyholder asking for permission to
              end your session early. Your keyholder can approve or deny the
              request.
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Reason for Request (optional):
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why you're requesting early release..."
              rows={4}
              maxLength={500}
              className="w-full p-3 rounded-lg border border-gray-600 bg-gray-800 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none"
            />
            <div className="text-xs text-gray-400 mt-1">
              {reason.length}/500 characters
            </div>
          </div>

          <div className="flex flex-col space-y-3">
            <button
              onClick={onSubmit}
              disabled={isSubmitting}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <FaSpinner className="animate-spin" />
                  Sending Request...
                </span>
              ) : (
                "Send Request"
              )}
            </button>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full bg-gray-600 hover:bg-gray-500 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface BegForReleaseButtonProps {
  sessionId: string;
  userId: string;
  keyholderUserId: string;
  disabled?: boolean;
  className?: string;
}

export const BegForReleaseButton: React.FC<BegForReleaseButtonProps> = ({
  sessionId,
  userId,
  keyholderUserId,
  disabled = false,
  className = "",
}) => {
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState("");

  const { data: pendingRequest, isLoading: isCheckingRequest } =
    usePendingRequestForSession(sessionId);
  const { createRequest, cancelRequest } = useReleaseRequestMutations();
  const { showSuccess, showError, showInfo } = useToast();

  const hasPendingRequest = !!pendingRequest;
  const isSubmitting = createRequest.isPending || cancelRequest.isPending;

  const handleSubmitRequest = async () => {
    try {
      await createRequest.mutateAsync({
        submissiveUserId: userId,
        keyholderUserId,
        sessionId,
        reason: reason.trim() || undefined,
      });

      showSuccess("Release request sent to your keyholder");
      setShowModal(false);
      setReason("");
    } catch {
      showError("Failed to send release request");
    }
  };

  const handleCancelRequest = async () => {
    if (!pendingRequest) return;

    try {
      await cancelRequest.mutateAsync({ requestId: pendingRequest.id });
      showInfo("Release request cancelled");
    } catch {
      showError("Failed to cancel request");
    }
  };

  if (isCheckingRequest) {
    return (
      <button
        disabled
        className={`bg-purple-500/50 text-white px-4 py-2 rounded font-medium flex items-center gap-2 ${className}`}
      >
        <FaSpinner className="animate-spin" />
        Checking...
      </button>
    );
  }

  // Show cancel button if request is pending
  if (hasPendingRequest) {
    return (
      <button
        onClick={handleCancelRequest}
        disabled={isSubmitting}
        className={`bg-gray-500 hover:bg-gray-600 disabled:opacity-50 text-white px-4 py-2 rounded font-medium transition-colors flex items-center gap-2 ${className}`}
      >
        {isSubmitting ? (
          <>
            <FaSpinner className="animate-spin" />
            Cancelling...
          </>
        ) : (
          <>
            <FaTimes />
            Cancel Request
          </>
        )}
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={disabled || isSubmitting}
        className={`bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white px-4 py-2 rounded font-medium transition-colors flex items-center gap-2 ${className}`}
      >
        <FaPrayingHands />
        Beg for Release
      </button>

      <RequestModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmitRequest}
        reason={reason}
        setReason={setReason}
        isSubmitting={isSubmitting}
      />
    </>
  );
};
