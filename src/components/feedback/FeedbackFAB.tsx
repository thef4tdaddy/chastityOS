// src/components/feedback/FeedbackFAB.tsx

import React, { useState } from "react";
import { FaPlus, FaBug, FaLightbulb, FaComment } from "react-icons/fa";
import FeedbackModal from "./FeedbackModal";
import { FeedbackService } from "../../services/feedbackService";
import type { FeedbackType, FeedbackData } from "../../types/feedback";

const FeedbackFAB: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType | null>(null);

  const openFeedback = (type: FeedbackType) => {
    setFeedbackType(type);
    setShowModal(true);
    setIsExpanded(false);
  };

  const handleFeedbackSubmit = async (feedback: FeedbackData) => {
    try {
      await FeedbackService.submitFeedback(feedback);
      // Success feedback could be shown here
      console.log("Feedback submitted successfully");
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      // Error handling - could show a toast notification
      throw error;
    }
  };

  return (
    <>
      {/* Main FAB */}
      <div className="fixed bottom-6 right-6 z-40">
        <div
          className={`transition-all duration-300 ${isExpanded ? "space-y-3" : "space-y-0"}`}
        >
          {/* Expanded Options */}
          {isExpanded && (
            <div className="space-y-3">
              <button
                onClick={() => openFeedback("bug")}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full shadow-lg transition-all transform translate-y-0 opacity-100"
              >
                <FaBug />
                <span className="text-sm font-medium">Report Bug</span>
              </button>

              <button
                onClick={() => openFeedback("feature")}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg transition-all transform translate-y-0 opacity-100"
              >
                <FaLightbulb />
                <span className="text-sm font-medium">Suggest Feature</span>
              </button>

              <button
                onClick={() => openFeedback("general")}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full shadow-lg transition-all transform translate-y-0 opacity-100"
              >
                <FaComment />
                <span className="text-sm font-medium">General Feedback</span>
              </button>
            </div>
          )}

          {/* Main Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all ${
              isExpanded ? "rotate-45" : "rotate-0"
            }`}
            aria-label="Open feedback options"
          >
            <FaPlus className="text-xl" />
          </button>
        </div>
      </div>

      {/* Backdrop for closing when expanded */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Feedback Modal */}
      {showModal && (
        <FeedbackModal
          type={feedbackType}
          onClose={() => {
            setShowModal(false);
            setFeedbackType(null);
          }}
          onSubmit={handleFeedbackSubmit}
        />
      )}
    </>
  );
};

export default FeedbackFAB;
