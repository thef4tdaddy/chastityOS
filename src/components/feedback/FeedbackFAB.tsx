// src/components/feedback/FeedbackFAB.tsx

import React, { useState } from "react";
import { Button } from "@/components/ui";
import { FaPlus, FaBug, FaLightbulb, FaComment } from "../../utils/iconImport";
import FeedbackModal from "./FeedbackModal";
// TODO: Replace with proper hook - components shouldn't import services directly
// import { FeedbackService } from "../../services/feedbackService";
import type { FeedbackType, FeedbackData } from "../../types/feedback";
import { logger } from "../../utils/logging";

// Feedback Options Component
interface FeedbackOptionsProps {
  onSelect: (type: FeedbackType) => void;
}

const FeedbackOptions: React.FC<FeedbackOptionsProps> = ({ onSelect }) => (
  <div className="space-y-3">
    <Button
      onClick={() => onSelect("bug")}
      className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full shadow-lg transition-all transform translate-y-0 opacity-100"
    >
      <FaBug />
      <span className="text-sm font-medium">Report Bug</span>
    </Button>

    <Button
      onClick={() => onSelect("feature")}
      className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg transition-all transform translate-y-0 opacity-100"
    >
      <FaLightbulb />
      <span className="text-sm font-medium">Suggest Feature</span>
    </Button>

    <Button
      onClick={() => onSelect("general")}
      className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full shadow-lg transition-all transform translate-y-0 opacity-100"
    >
      <FaComment />
      <span className="text-sm font-medium">General Feedback</span>
    </Button>
  </div>
);

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
      // TODO: Replace with proper hook - components shouldn't call services directly
      // await FeedbackService.submitFeedback(feedback);
      logger.info(
        "Feedback submission temporarily disabled - needs hook implementation",
        feedback,
      );
    } catch (error) {
      logger.error("Failed to submit feedback", error);
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
          {isExpanded && <FeedbackOptions onSelect={openFeedback} />}

          {/* Main Button */}
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all ${
              isExpanded ? "rotate-45" : "rotate-0"
            }`}
            aria-label="Open feedback options"
          >
            <FaPlus className="text-xl" />
          </Button>
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
